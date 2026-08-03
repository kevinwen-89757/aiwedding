/**
 * Unified API catch-all route
 * All /api/* requests are handled here to stay within Vercel Hobby Plan's 12 serverless function limit.
 * Route matching: /api/[...segments]
 */
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

type Context = { params: Promise<{ slug?: string[] }> };

function jsonError(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

// 生成任务提交/轮询保存（下载 4K + 水印 + 上传 COS）单张可达 20-40 秒，
// Vercel Fluid Compute 模式下 Hobby 计划 maxDuration 上限为 300 秒。
// ⚠️ 若部署报错说明项目未启用 Fluid Compute，需在 Vercel 控制台开启或改回 60。
export const maxDuration = 300;

// ─── Route helpers ───────────────────────────────────────────────────────────

function match(slug: string[], ...pattern: (string | null)[]): Record<string, string> | null {
  if (slug.length !== pattern.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    if (p === null) {
      params[`_${i}`] = slug[i];
    } else if (p.startsWith(":")) {
      params[p.slice(1)] = slug[i];
    } else if (p !== slug[i]) {
      return null;
    }
  }
  return params;
}

// ─── Handler imports (lazy to keep each bundle lean) ─────────────────────────

async function handleHealthGET() {
  const { appConfig } = await import("@/lib/config");
  const { ensureLocalStore } = await import("@/services/localStore");
  let storageReady = true;
  try { await ensureLocalStore(); } catch { storageReady = false; }
  return NextResponse.json({ ok: storageReady, mode: appConfig.generationMode, provider: appConfig.generationProvider, storageReady });
}

async function handleOrdersPOST(request: Request) {
  const { appConfig } = await import("@/lib/config");
  const { createOrderWithUploads } = await import("@/services/localStore");
  const { saveUpload } = await import("@/services/storage");
  const { imageMetadataFromBuffer } = await import("@/services/watermark");

  function uploadConfigDetail() {
    return [`STORAGE_DRIVER=${appConfig.storageDriver}`, `SUPABASE_URL configured: ${Boolean(appConfig.supabaseUrl)}`, `SERVICE_ROLE configured: ${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}`, `BUCKET configured: ${Boolean(appConfig.supabaseStorageBucket)}`].join("; ");
  }

  try {
    const startedAt = Date.now();
    const contentType = request.headers.get("content-type") ?? "";
    // ── 新流程：照片已由浏览器用预签名 URL 直传 COS，这里只接收元数据并落库订单 ──
    // 请求体很小（仅 orderId + 两张照片的 COS key/尺寸），Vercel 函数几乎瞬时返回，
    // 彻底避开「大图经 Vercel 转发到 COS 超过 60s → 504」的问题。
    if (contentType.includes("application/json")) {
      return await handleOrdersCreateJSON(request, startedAt);
    }
    const formData = await request.formData();
    console.log("[create-order] formData parsed", { ms: Date.now() - startedAt, driver: appConfig.storageDriver, dbMode: appConfig.storageDriver === "s3" ? "cos" : (Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) ? "supabase" : "local") });
    const customerName = formData.get("customerName");
    if (typeof customerName !== "string" || !customerName.trim()) return jsonError("请填写姓名，方便后台识别订单", 400);
    const bridePhoto = formData.get("bridePhoto");
    const groomPhoto = formData.get("groomPhoto");
    if (!(bridePhoto instanceof File) || bridePhoto.size === 0) {
      if (!(groomPhoto instanceof File) || groomPhoto.size === 0) return jsonError("请分别上传新娘和新郎正脸照", 400);
      return jsonError("请上传新娘正脸照", 400);
    }
    if (!(groomPhoto instanceof File) || groomPhoto.size === 0) return jsonError("请上传新郎正脸照", 400);

    const orderId = randomUUID();
    // 两张照片并行上传到 COS（仅上传；尺寸在内存中计算，不再从存储下载回来）。
    const [brideStored, groomStored] = await Promise.all([
      saveUpload(bridePhoto, orderId, "bride"),
      saveUpload(groomPhoto, orderId, "groom"),
    ]);
    console.log("[create-order] photos uploaded", { ms: Date.now() - startedAt });
    const [brideMeta, groomMeta] = await Promise.all([
      imageMetadataFromBuffer(brideStored.buffer),
      imageMetadataFromBuffer(groomStored.buffer),
    ]);
    // 单次读 + 单次写完成建订单 + 两张照片资产 + 上传记录（COS 模式下把 ~10 次往返压到 2 次）。
    const order = await createOrderWithUploads(
      { customerName: formData.get("customerName"), customerPhone: formData.get("customerPhone"), customerEmail: formData.get("customerEmail"), photoType: formData.get("photoType") },
      orderId,
      [
        { role: "bride", original_path: brideStored.relativePath, mime_type: brideStored.mimeType, width: brideMeta.width, height: brideMeta.height, size: bridePhoto.size },
        { role: "groom", original_path: groomStored.relativePath, mime_type: groomStored.mimeType, width: groomMeta.width, height: groomMeta.height, size: groomPhoto.size },
      ]
    );
    console.log("[create-order] done", { orderId: order?.id, totalMs: Date.now() - startedAt });
    return NextResponse.json({ orderId: order!.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("POST /api/orders failed:", message);
    return NextResponse.json({ error: message || "创建订单失败，请稍后重试。", detail: uploadConfigDetail() }, { status: 500 });
  }
}

// 新流程：前端先用 /api/orders/presign 拿到预签名 URL，把照片直传 COS，
// 再带着「orderId + 照片的 COS 路径」调用本接口落库订单。函数内不再搬运照片字节。
async function handleOrdersCreateJSON(request: Request, startedAt: number) {
  const { createOrderWithUploads } = await import("@/services/localStore");
  try {
    const body = await request.json();
    const orderId = typeof body.orderId === "string" && body.orderId.trim() ? body.orderId.trim() : null;
    if (!orderId) return jsonError("缺少 orderId（请先完成照片上传）", 400);
    const photos = Array.isArray(body.photos) ? body.photos : [];
    if (photos.length < 1) return jsonError("缺少照片上传信息", 400);

    const order = await createOrderWithUploads(
      { customerName: body.customerName, customerPhone: body.customerPhone, customerEmail: body.customerEmail, photoType: body.photoType },
      orderId,
      photos.map((p: Record<string, unknown>) => ({
        role: p.role === "groom" ? "groom" : "bride",
        original_path: typeof p.relativePath === "string" ? p.relativePath : "",
        mime_type: typeof p.mimeType === "string" ? p.mimeType : "image/jpeg",
        width: typeof p.width === "number" ? p.width : null,
        height: typeof p.height === "number" ? p.height : null,
        size: typeof p.size === "number" ? p.size : 0,
      }))
    );
    if (!order) return jsonError("创建订单失败，请稍后重试。", 500);
    console.log("[create-order-json] done", { orderId: order.id, totalMs: Date.now() - startedAt });
    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建订单失败";
    console.error("POST /api/orders (json) failed:", message);
    return NextResponse.json({ error: message || "创建订单失败，请稍后重试。" }, { status: 500 });
  }
}

// 生成预签名 PUT URL，供浏览器把照片直接上传到 COS（不经过 Vercel 函数）。
async function handleOrdersPresignPOST(request: Request) {
  const { appConfig } = await import("@/lib/config");
  const { presignPutObject, uploadRelativePath } = await import("@/services/storage");
  if (appConfig.storageDriver !== "s3") {
    return jsonError("当前存储模式不支持直传上传（仅 S3/COS 模式可用）", 400);
  }
  try {
    const body = await request.json();
    const uploads = Array.isArray(body.uploads) ? body.uploads : [];
    if (uploads.length < 1 || uploads.length > 4) return jsonError("上传文件数量不合法（1-4 张）", 400);
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    const orderId = randomUUID();
    const result = [];
    for (const u of uploads) {
      const role: "bride" | "groom" = u.role === "groom" ? "groom" : "bride";
      const mimeType = allowed.has(u.mimeType) ? u.mimeType : "image/jpeg";
      const ext = mimeType === "image/png" ? ".png" : mimeType === "image/webp" ? ".webp" : ".jpg";
      const relativePath = uploadRelativePath(orderId, role, ext);
      const uploadUrl = await presignPutObject(relativePath, mimeType);
      result.push({ role, relativePath, uploadUrl, mimeType });
    }
    return NextResponse.json({ orderId, uploads: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成上传凭证失败";
    console.error("POST /api/orders/presign failed:", message);
    return NextResponse.json({ error: message || "生成上传凭证失败，请稍后重试。" }, { status: 500 });
  }
}

async function handleOrderByIdGET(id: string) {
  const { getLocalOrder } = await import("@/services/localStore");
  const order = await getLocalOrder(id);
  return order ? NextResponse.json(order) : jsonError("Order not found", 404);
}

async function handleOrderThemesPOST(request: Request, id: string) {
  const { saveLocalThemeSelection } = await import("@/services/localStore");
  const { weddingThemes } = await import("@/services/prompts");
  const body = await request.json();
  const themeIds: unknown[] = Array.isArray(body.themeIds) ? body.themeIds : [];
  const validIds = new Set(weddingThemes.map((theme) => theme.themeId));
  const selectedIds = themeIds.filter((themeId): themeId is string => typeof themeId === "string" && validIds.has(themeId));
  try {
    const order = await saveLocalThemeSelection(id, selectedIds);
    if (!order) return jsonError("Order not found", 404);
    return NextResponse.json({ themeIds: order.selected_theme_ids });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Theme selection failed", 400);
  }
}

async function handleOrderSelectionPOST(request: Request, id: string) {
  const { saveLocalSelection } = await import("@/services/localStore");
  const body = await request.json();
  const order = await saveLocalSelection(id, Array.isArray(body.assetIds) ? body.assetIds : []);
  if (!order) return jsonError("Order not found", 404);
  return NextResponse.json({ selectedCount: order.selected_count, amountCents: order.selection_amount_cents });
}

async function handleOrderPollGenerationPOST(id: string) {
  const { getGenerationRuntimeConfig, pollApiGeneration, generateOrderPreviews } = await import("@/services/generation");
  const { getLocalOrder } = await import("@/services/localStore");
  const current = await getLocalOrder(id);
  if (!current) return jsonError("Order not found", 404);
  try {
    // 自愈：状态页每 60 秒轮询时触发。
    // 1) 已付款但未提交任务（ready_to_generate）→ 自动启动生成；
    // 2) 生成中但任务数少于计划（被超时掐断）→ 续交剩余任务（断点续传）；
    // 3) 生成中存在卡死任务（polling/created 超过阈值，APIMart 队列已丢弃）→ 重新提交。
    // 触发重提时本轮【不再】调用 poll（避免与「提交写」竞争 orders.json 导致互相覆盖），
    // 下一次自动轮询（60s 后）再查询新提交的任务。重提本身 fire-and-forget，
    // 不在本次请求内 await，避免叠加保存耗时冲破 Cloudflare ~100s 上限（520）。
    const planned = getGenerationRuntimeConfig(current)?.plannedTaskCount ?? 0;
    const submitted = current.generation_jobs?.length ?? 0;
    const stuckCount = (current.generation_jobs ?? []).filter(
      // ⚠️ 计费护栏：只有「还有重试额度」的卡死任务才触发重提，否则会无限重提反复扣费。
      // ⚠️ 阈值与 startApiGeneration 对齐（90 分钟 / 60 次轮询）：4K 生成本身就慢，不能因超龄就重提。
      (j) =>
        (j.status === "polling" || j.status === "created") &&
        (j.create_attempt ?? 1) < Number(process.env.MAX_CREATE_ATTEMPTS ?? 2) &&
        (Date.now() - Date.parse(j.created_at) > Number(process.env.STUCK_TASK_AGE_MS ?? 90 * 60 * 1000) || (j.poll_count ?? 0) >= Number(process.env.STUCK_TASK_POLL_THRESHOLD ?? 60))
    ).length;
    // 计费护栏：预算已耗尽时，重提必然因预算熔断创建 0 个任务、反而清空/打乱已有任务 → 丢失已生成的图。
    // 此时不再走重提分支，改走 pollApiGeneration 把已提交的 4K 任务存下来。
    const createBudgetRatio = Number(process.env.CREATE_BUDGET_RATIO ?? 1.5);
    const budgetCap = Math.max(planned, Math.ceil(planned * createBudgetRatio));
    const createCount = (current.metadata?.apimartCreateCount as number) ?? 0;
    const budgetExhausted = createCount >= budgetCap;
    const needsResubmit = !budgetExhausted && ((current.status === "ready_to_generate" && submitted === 0) || (current.status === "generating" && (submitted < planned || stuckCount > 0)));
    let order: Awaited<ReturnType<typeof getLocalOrder>> | null = current;
    let pollDebug: Record<string, unknown> | undefined;
    if (needsResubmit) {
      // 必须 await（不能 fire-and-forget）：Vercel 在 HTTP 响应返回后可能冻结后台任务，
      // 若用 fire-and-forget，重新提交会被截断、永远跑不完。await 期间函数保持存活，
      // 且重新提交约 38s，远低于 Cloudflare ~100s / Vercel 300s 上限。
      // 本轮不再做重量级 poll 保存（避免叠加超时），下一次 60s 自动轮询再查新任务。
      try {
        await generateOrderPreviews(id, { source: "admin" });
      } catch (e) {
        console.error("[poll-resume/stuck] failed:", e);
      }
      order = await getLocalOrder(id);
    } else {
      const pollResult = await pollApiGeneration(id);
      order = pollResult.order;
      pollDebug = pollResult.debug;
    }
    return NextResponse.json({ ok: true, status: order?.status, generatedCount: order?.order_assets.filter((a) => a.kind === "generated").length ?? 0, pendingCount: order?.generation_jobs?.filter((job) => job.status !== "completed" && job.status !== "failed").length ?? 0, generationJobsCount: order?.generation_jobs?.length ?? 0, debug: pollDebug });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Poll generation failed", 500);
  }
}

async function handleOrderIdPhotoPollPOST(id: string) {
  const { pollIdPhotoTasks } = await import("@/services/generation");
  const { getLocalOrder } = await import("@/services/localStore");
  const current = await getLocalOrder(id);
  if (!current) return jsonError("Order not found", 404);
  try {
    const results = await pollIdPhotoTasks(id);
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Poll ID photo failed", 500);
  }
}

async function handleOrderWechatQueryGET(request: Request, id: string) {
  const { getLocalOrder } = await import("@/services/localStore");
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") === "selection" ? "selection" : "deposit";
  const order = await getLocalOrder(id);
  if (!order) return jsonError("Order not found", 404);
  const paid = order.payments.some((p) => p.kind === kind && p.status === "paid");
  return NextResponse.json({ ok: true, paid, status: order.status });
}

async function handleDownloadGET(request: Request, assetId: string) {
  const { adminUnauthorized } = await import("@/lib/admin");
  const { findLocalAsset } = await import("@/services/localStore");
  const { readStoredFile } = await import("@/services/storage");
  const url = new URL(request.url);
  const preview = url.searchParams.get("preview") === "1";
  const show4k = url.searchParams.get("show4k") === "1";
  const asset = await findLocalAsset(assetId);
  if (!asset) return jsonError("Asset not found", 404);
  if (asset.kind === "upload") {
    const unauthorized = adminUnauthorized(request);
    if (unauthorized) return unauthorized;
  }
  const pathToRead = preview ? asset.preview_path : asset.original_path;
  if (!pathToRead) return jsonError("File not found", 404);
  if (!preview && !show4k && asset.kind === "generated" && !asset.is_unlocked) return jsonError("Asset is locked", 403);
  if (show4k && asset.kind === "generated") {
    // 4K 水印预览：缩放到 2000px + 半透明水印，速度快，防截图
    const { createWatermarked4KBuffer } = await import("@/services/watermark");
    try {
      const file = await readStoredFile(asset.original_path);
      const watermarked = await createWatermarked4KBuffer(file);
      return new NextResponse(new Uint8Array(watermarked), {
        headers: {
          "content-type": "image/jpeg",
          "cache-control": "no-cache, no-store, must-revalidate",
          "content-disposition": "inline",
          "x-content-type-options": "nosniff",
          "pragma": "no-cache",
          "expires": "0"
        }
      });
    } catch (e) {
      console.error("[show4k] watermark failed:", e);
      // fallback: 返回低分辨率水印预览
      const fallbackFile = await readStoredFile(asset.preview_path ?? asset.original_path);
      return new NextResponse(new Uint8Array(fallbackFile), {
        headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=60" }
      });
    }
  }
  const file = await readStoredFile(pathToRead);
  return new NextResponse(new Uint8Array(file), { headers: { "content-type": preview ? "image/jpeg" : asset.mime_type, "cache-control": "private, max-age=60" } });
}

async function handleOrderSelectionViewPOST(id: string) {
  const { updateLocalOrder } = await import("@/services/localStore");
  const { getLocalOrder } = await import("@/services/localStore");
  const current = await getLocalOrder(id);
  if (!current) return jsonError("Order not found", 404);
  await updateLocalOrder(id, (order) => ({
    ...order,
    selection_view_count: (order.selection_view_count ?? 0) + 1
  }));
  return NextResponse.json({ ok: true });
}

async function handlePaymentsMockPOST(request: Request) {
  const { createMockTradeNo } = await import("@/services/payment");
  const { payLocalOrder } = await import("@/services/localStore");
  const { generateIdPhotoTasks, generateOrderPreviews } = await import("@/services/generation");
  const body = await request.json();
  if (!body.orderId || !["deposit", "selection"].includes(body.kind)) return jsonError("orderId and kind are required");
  try {
    const order = await payLocalOrder(body.orderId, body.kind, createMockTradeNo(body.kind));
    if (order && body.kind === "deposit") {
      // 后台启动；状态页轮询会兜底续交。
      void (async () => {
        try {
          await generateOrderPreviews(body.orderId, { source: "admin" });
        } catch (e) {
          console.error("[auto-generation] failed:", e);
        }
        if (order.photo_type === "casual_photo") {
          try {
            await generateIdPhotoTasks(body.orderId);
          } catch (e) {
            console.error("[id-photo] failed:", e);
          }
        }
      })();
    }
    return order ? NextResponse.json({ ok: true }) : jsonError("Order not found", 404);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Payment failed", 400);
  }
}

async function handlePaymentsWechatCreatePOST(request: Request) {
  const { unifiedOrder } = await import("@/services/wechatPay");
  const { getLocalOrder, updateLocalOrder } = await import("@/services/localStore");
  const { appConfig } = await import("@/lib/config");
  const body = await request.json();
  const { orderId, kind } = body;
  if (!orderId || !["deposit", "selection"].includes(kind)) return jsonError("orderId and kind are required");
  const order = await getLocalOrder(orderId);
  if (!order) return jsonError("Order not found", 404);
  const amount = kind === "deposit" ? order.deposit_amount_cents : order.selection_amount_cents;
  if (amount <= 0) return jsonError("No payable amount");
  const wx = appConfig.wechatPay;
  if (!wx?.appId || !wx?.mchId || !wx?.apiKey) return jsonError("微信支付未配置", 500);
  const outTradeNo = `${kind === "deposit" ? "D" : "S"}${Date.now()}${orderId.slice(0, 6)}`;
  await updateLocalOrder(orderId, (o) => { o.metadata = { ...(o.metadata || {}), [`wechat_trade_no_${kind}`]: outTradeNo }; return o; });
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "127.0.0.1";
  try {
    const result = await unifiedOrder({ appId: wx.appId, mchId: wx.mchId, apiKey: wx.apiKey, body: kind === "deposit" ? "AI婚纱照-试看费" : "AI婚纱照-选片费", outTradeNo, totalFee: amount, spbillCreateIp: clientIp, notifyUrl: `${appConfig.appUrl}/api/payments/wechat/notify` });
    if (result.returnCode !== "SUCCESS" || result.resultCode !== "SUCCESS") return jsonError(result.returnMsg || "统一下单失败", 500);
    return NextResponse.json({ ok: true, codeUrl: result.codeUrl, outTradeNo });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "统一下单失败", 500);
  }
}

async function handlePaymentsWechatNotifyPOST(request: Request) {
  const { parseXml, verifyNotifySign, buildXml } = await import("@/services/wechatPay");
  const { appConfig } = await import("@/lib/config");
  const { listLocalOrders, payLocalOrder } = await import("@/services/localStore");
  const xml = await request.text();
  const data = parseXml(xml);
  const wx = appConfig.wechatPay;
  if (!wx?.apiKey) return new NextResponse(buildXml({ return_code: "FAIL", return_msg: "配置错误" }), { status: 500, headers: { "Content-Type": "application/xml" } });
  if (!verifyNotifySign(data, wx.apiKey)) return new NextResponse(buildXml({ return_code: "FAIL", return_msg: "签名验证失败" }), { status: 400, headers: { "Content-Type": "application/xml" } });
  if (data.return_code !== "SUCCESS" || data.result_code !== "SUCCESS") return new NextResponse(buildXml({ return_code: "SUCCESS" }), { status: 200, headers: { "Content-Type": "application/xml" } });
  const outTradeNo = data.out_trade_no;
  if (!outTradeNo) return new NextResponse(buildXml({ return_code: "FAIL", return_msg: "缺少订单号" }), { status: 400, headers: { "Content-Type": "application/xml" } });
  const kind = outTradeNo.startsWith("D") ? "deposit" : "selection";
  const orders = await listLocalOrders();
  const order = orders.find((o) => o.metadata?.[`wechat_trade_no_${kind}`] === outTradeNo);
  if (!order) return new NextResponse(buildXml({ return_code: "FAIL", return_msg: "订单不存在" }), { status: 404, headers: { "Content-Type": "application/xml" } });
  try {
    await payLocalOrder(order.id, kind as "deposit" | "selection", outTradeNo);
    // 微信要求回调数秒内返回 SUCCESS，故此处不同步触发生成（避免超时/重复通知）。
    // 改为 fire-and-forget 尽力启动；若 Serverless 冻结导致未跑完，
    // 状态页每 60 秒的自动轮询（poll-generation）会兜底补启动（顾客停留在状态页时）。
    if (kind === "deposit") {
      const { generateOrderPreviews, generateIdPhotoTasks } = await import("@/services/generation");
      void (async () => {
        try {
          await generateOrderPreviews(order.id, { source: "admin" });
        } catch (e) {
          console.error("[wechat auto-generation] failed (poll will retry):", e);
        }
        if (order.photo_type === "casual_photo") {
          try {
            await generateIdPhotoTasks(order.id);
          } catch (e) {
            console.error("[id-photo] failed:", e);
          }
        }
      })();
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "支付确认失败";
    return new NextResponse(buildXml({ return_code: "FAIL", return_msg: msg }), { status: 500, headers: { "Content-Type": "application/xml" } });
  }
  return new NextResponse(buildXml({ return_code: "SUCCESS" }), { status: 200, headers: { "Content-Type": "application/xml" } });
}

// ─── Admin handlers ───────────────────────────────────────────────────────────

async function handleAdminOrdersGET(request: Request) {
  const { adminUnauthorized } = await import("@/lib/admin");
  const { listLocalOrders } = await import("@/services/localStore");
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json(await listLocalOrders());
}

async function handleAdminOrderByIdDELETE(request: Request, id: string) {
  const { adminUnauthorized } = await import("@/lib/admin");
  const { deleteLocalOrder, getLocalOrder } = await import("@/services/localStore");
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const current = await getLocalOrder(id);
  if (!current) return jsonError("Order not found", 404);
  await deleteLocalOrder(id);
  return NextResponse.json({ ok: true });
}

async function handleAdminOrderByIdPATCH(request: Request, id: string) {
  const { adminUnauthorized } = await import("@/lib/admin");
  const { confirmLocalPayment, generateIdPhotoTasks, generateOrderPreviews } = await (async () => {
    const { confirmLocalPayment } = await import("@/services/localStore");
    const { generateIdPhotoTasks, generateOrderPreviews } = await import("@/services/generation");
    return { confirmLocalPayment, generateIdPhotoTasks, generateOrderPreviews };
  })();
  const { getLocalOrder, updateLocalOrder, updateLocalOrderStatus } = await import("@/services/localStore");
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const body = await request.json();
  const current = await getLocalOrder(id);
  if (!current) return jsonError("Order not found", 404);
  if (body.action === "set_resolution") {
    const resolution = body.resolution as string;
    if (!["1K", "2K", "4K"].includes(resolution)) return jsonError("Invalid resolution. Must be 1K, 2K, or 4K.");
    await updateLocalOrder(id, (order) => ({ ...order, generation_resolution: resolution as "1K" | "2K" | "4K" }));
    return NextResponse.json({ ok: true, generation_resolution: resolution });
  }
  if (body.action === "confirm_deposit") {
    await confirmLocalPayment(id, "deposit");
    // 后台启动；状态页轮询会兜底续交。
    void (async () => {
      try {
        await generateOrderPreviews(id, { source: "admin" });
      } catch (e) {
        console.error("[auto-generation] failed:", e);
      }
      if (current.photo_type === "casual_photo") {
        try {
          await generateIdPhotoTasks(id);
        } catch (e) {
          console.error("[id-photo] failed:", e);
        }
      }
    })();
    return NextResponse.json({ ok: true });
  }
  if (body.action === "confirm_selection") {
    await confirmLocalPayment(id, "selection");
    return NextResponse.json({ ok: true });
  }
  if (body.action === "force_release") {
    if (current.status !== "generating") return jsonError("只有生成中的订单才能强制上线", 400);
    await updateLocalOrder(id, (order) => {
      order.status = "pending_selection";
      order.generation_jobs = (order.generation_jobs ?? []).map((job) =>
        job.status === "created" || job.status === "polling"
          ? { ...job, status: "failed" as const, error: "管理员强制上线，未完成任务已舍弃", updated_at: new Date().toISOString() }
          : job
      );
      const notePrefix = order.admin_note ? order.admin_note + "\n" : "";
      order.admin_note = `${notePrefix}[${new Date().toISOString()}] 管理员强制上线：订单状态从 generating → pending_selection，未完成任务已标记为失败。`;
      return order;
    });
    return NextResponse.json({ ok: true, released: true });
  }
  if (body.action === "reset_create_count") {
    // 运维恢复动作：重置本单「累计创建任务计数」并给在跑任务新的重试额度。
    // 用于计费护栏误伤后的止损（例如慢速 4K 任务被当卡死删除重提、计数逼近预算上限，
    // 导致缺失图无法重建）。只动计数与 create_attempt，不删除任何任务/资产。
    const target = Number.isFinite(Number(body.value)) ? Number(body.value) : 0;
    await updateLocalOrder(id, (order) => ({
      ...order,
      metadata: { ...(order.metadata ?? {}), apimartCreateCount: target },
      generation_jobs: (order.generation_jobs ?? []).map((job) => ({ ...job, create_attempt: 1 }))
    }));
    return NextResponse.json({ ok: true, apimartCreateCount: target });
  }
  if (body.action === "reset_generation") {
    // 整单重跑：作废当前所有生成结果（图 + 任务），把创建计数归零、状态拉回 ready_to_generate，
    // 让下一次 start-generation 走 FRESH 路径重新提交全部任务（clearLocalGeneratedAssets 会清掉云端旧图）。
    await updateLocalOrder(id, (order) => ({
      ...order,
      status: "ready_to_generate",
      generation_jobs: [],
      order_assets: (order.order_assets ?? []).filter((a) => a.kind !== "generated"),
      metadata: { ...(order.metadata ?? {}), apimartCreateCount: 0 },
      admin_note: `${order.admin_note ? order.admin_note + "\n" : ""}[${new Date().toISOString()}] 管理员触发整单重跑：已作废原生成图与任务、创建计数归零，状态置为 ready_to_generate。`
    }));
    return NextResponse.json({ ok: true, reset: true });
  }
  const order = await updateLocalOrderStatus(id, body.status ?? current.status, { admin_note: body.adminNote ?? null, reject_reason: body.rejectReason ?? null });
  return order ? NextResponse.json({ ok: true }) : jsonError("Order not found", 404);
}

async function handleAdminStartGenerationPOST(request: Request, id: string) {
  const { adminUnauthorized } = await import("@/lib/admin");
  const { appConfig } = await import("@/lib/config");
  const { generateOrderPreviews, getGenerationRuntimeConfig, getReferenceUploadAssets } = await import("@/services/generation");
  const { getLocalOrder } = await import("@/services/localStore");
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const order = await getLocalOrder(id);
  if (!order) return jsonError("Order not found", 404);
  if (order.status !== "ready_to_generate" && order.status !== "generation_failed" && order.status !== "failed") return jsonError(`当前状态 ${order.status} 不允许启动生成，仅 ready_to_generate / generation_failed / failed 可触发。`, 409);
  const references = getReferenceUploadAssets(order);
  const runtimeConfig = getGenerationRuntimeConfig(order);
  console.log("[start-generation] api precheck", { orderId: id, status: order.status, hasBridePhoto: Boolean(references.bride), hasGroomPhoto: Boolean(references.groom), selectedThemeIds: order.selected_theme_ids, generationMode: appConfig.generationMode, provider: appConfig.generationProvider, hasApiKey: Boolean(process.env.APIMART_API_KEY), testLimit: runtimeConfig.generationTestLimit, effectiveLimit: runtimeConfig.effectiveLimit, planLength: runtimeConfig.planLength, resolution: runtimeConfig.apimartResolution, timeoutMs: runtimeConfig.apimartTimeoutMs, plannedTaskCount: runtimeConfig.plannedTaskCount, generationJobsCount: order.generation_jobs?.length ?? 0, generatedAssetsCount: order.order_assets.filter((a) => a.kind === "generated").length });
  try {
    await generateOrderPreviews(id, { source: "admin" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Generation failed", 500);
  }
}

async function handleAdminPollGenerationPOST(request: Request, id: string) {
  // 注意：此接口对订单本身公开（订单 ID 是不可猜测的 UUID，与状态页的
  // 公开读取同等级别），供状态页每 60 秒自动轮询调用，无需 admin token。
  // 若强制要求 admin 鉴权，状态页无法携带 token，自动轮询（含自动启动
  // 生成与断点续传）将全部失效，只能靠后台手动点击。
  const { getGenerationRuntimeConfig, pollApiGeneration, generateOrderPreviews } = await import("@/services/generation");
  const { getLocalOrder } = await import("@/services/localStore");
  try {
    const current = await getLocalOrder(id);
    const runtimeConfig = current ? getGenerationRuntimeConfig(current) : null;
    console.log("[poll-generation] api precheck", { orderId: id, status: current?.status, effectiveLimit: runtimeConfig?.effectiveLimit, planLength: runtimeConfig?.planLength, plannedTaskCount: runtimeConfig?.plannedTaskCount, resolution: runtimeConfig?.apimartResolution, timeoutMs: runtimeConfig?.apimartTimeoutMs, generationJobsCount: current?.generation_jobs?.length ?? 0, generatedAssetsCount: current?.order_assets.filter((a) => a.kind === "generated").length ?? 0 });
    // 自愈：订单已付款（ready_to_generate）但尚未提交任何生成任务时，
    // 由状态页的自动轮询（每 60 秒）补启动生成。这样即便触发入口的
    // 后台任务被 Serverless 环境中断，也能靠客户端轮询自动救回。
    // 此外，若生成已开始（generating）但任务数少于计划，说明上一轮
    // 被 60 秒超时掐断，这里续交剩余任务（断点续传）。
    if (current) {
      const planned = runtimeConfig?.plannedTaskCount ?? 0;
      const submitted = current.generation_jobs?.length ?? 0;
      const stuckCount = (current.generation_jobs ?? []).filter(
        // ⚠️ 阈值与 startApiGeneration 对齐（90 分钟 / 60 次轮询）：4K 生成本身就慢，
        // 若用 20 分钟阈值，正常生成的任务会被误判卡死 → 每 60s 走重提分支 → 永远不进
        // pollApiGeneration → 已完成的图永远存不下来。
        (j) => (j.status === "polling" || j.status === "created") && ((j.create_attempt ?? 1) < Number(process.env.MAX_CREATE_ATTEMPTS ?? 2)) && (Date.now() - Date.parse(j.created_at) > Number(process.env.STUCK_TASK_AGE_MS ?? 90 * 60 * 1000) || (j.poll_count ?? 0) >= Number(process.env.STUCK_TASK_POLL_THRESHOLD ?? 60))
      ).length;
      // 计费护栏：预算已耗尽时，重提必然因预算熔断创建 0 个任务、反而清空/打乱已有任务 → 丢失已生成的图。
      // 此时不再走重提分支，改走 pollApiGeneration 把已提交的 4K 任务存下来。
      const createBudgetRatio = Number(process.env.CREATE_BUDGET_RATIO ?? 1.5);
      const budgetCap = Math.max(planned, Math.ceil(planned * createBudgetRatio));
      const createCount = (current.metadata?.apimartCreateCount as number) ?? 0;
      const budgetExhausted = createCount >= budgetCap;
      // 触发重提时本轮不再做重量级 poll 保存（避免与提交写竞争 orders.json、叠加超时），
      // 下一次 60s 自动轮询再查新任务；重提本身会 await 跑完（见下方分支）。
      const needsResubmit = !budgetExhausted && ((current.status === "ready_to_generate" && submitted === 0) || (current.status === "generating" && (submitted < planned || stuckCount > 0)));
      if (needsResubmit) {
        // 必须 await（不能 fire-and-forget）：Vercel 在 HTTP 响应返回后可能冻结后台任务，
        // 若用 fire-and-forget，重新提交会被截断、永远跑不完。await 期间函数保持存活，
        // 且重新提交预算 GENERATION_TIME_BUDGET_MS=90s，压在 Cloudflare ~100s 掐断前返回，
        // 避免客户端 524 后状态页重复触发 → 两个函数并发提交同一张图重复扣费。
        // 本轮不再做重量级 poll 保存（避免叠加超时），下一次 60s 自动轮询再查新任务。
        // ⚠️ 因此「提交阶段」越慢，顾客看到「已生成 0 张」的时间就越长——提交预算不能设太小。
        try {
          await generateOrderPreviews(id, { source: "admin" });
        } catch (e) {
          console.error("[poll-resume/stuck] failed:", e);
        }
        const refreshed = await getLocalOrder(id);
        return NextResponse.json({ ok: true, status: refreshed?.status, generatedCount: refreshed?.order_assets.filter((a) => a.kind === "generated").length ?? 0, pendingCount: refreshed?.generation_jobs?.filter((job) => job.status !== "completed" && job.status !== "failed").length ?? 0, generationJobsCount: refreshed?.generation_jobs?.length ?? 0 });
      }
      const pollResult = await pollApiGeneration(id);
      const order = pollResult.order;
      return NextResponse.json({ ok: true, status: order?.status, generatedCount: order?.order_assets.filter((a) => a.kind === "generated").length ?? 0, pendingCount: order?.generation_jobs?.filter((job) => job.status !== "completed" && job.status !== "failed").length ?? 0, generationJobsCount: order?.generation_jobs?.length ?? 0, debug: pollResult.debug });
    }
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Poll generation failed", 500);
  }
}

async function handleAdminCompleteGenerationPOST(request: Request, id: string) {
  const { adminUnauthorized } = await import("@/lib/admin");
  const { completeManualGeneration } = await import("@/services/generation");
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  try {
    await completeManualGeneration(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Complete generation failed", 400);
  }
}

async function handleAdminGeneratedResultsPOST(request: Request, id: string) {
  const { adminUnauthorized } = await import("@/lib/admin");
  const { uploadManualGeneratedResults } = await import("@/services/generation");
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const formData = await request.formData();
  const files = formData.getAll("images").filter((file): file is File => file instanceof File && file.size > 0);
  if (files.length < 1) return jsonError("请选择至少 1 张图片");
  try {
    const result = await uploadManualGeneratedResults(id, files);
    return NextResponse.json({ ok: true, uploadedCount: result.uploadedCount, planCount: result.planCount, message: result.message ?? `已上传 ${result.uploadedCount} 张，已自动生成水印预览。` });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Upload failed", 400);
  }
}

async function handleAdminRegenerateWatermarksPOST(request: Request, id: string) {
  const { adminUnauthorized } = await import("@/lib/admin");
  const { regenerateOrderWatermarks } = await import("@/services/generation");
  const { getLocalOrder } = await import("@/services/localStore");
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const order = await getLocalOrder(id);
  if (!order) return jsonError("订单不存在", 404);
  let options: { text?: string; opacity?: number } | undefined;
  try {
    const body = await request.json();
    if (body.text || body.opacity !== undefined) {
      options = {};
      if (typeof body.text === "string" && body.text.trim()) options.text = body.text.trim();
      if (typeof body.opacity === "number" && body.opacity >= 0 && body.opacity <= 1) options.opacity = Math.round(body.opacity * 100) / 100;
    }
  } catch { /* no body */ }
  const result = await regenerateOrderWatermarks(id, options);
  return NextResponse.json({ ok: true, ...result });
}

async function handleAdminTaskPromptsGET(request: Request, id: string) {
  const { adminUnauthorized } = await import("@/lib/admin");
  const { getLocalOrder } = await import("@/services/localStore");
  const { buildOrderInfo, formatGenerationPrompts } = await import("@/services/generation");
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const order = await getLocalOrder(id);
  if (!order) return jsonError("Order not found", 404);
  const upload = order.order_assets.find((asset) => asset.kind === "upload");
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "json") return NextResponse.json(buildOrderInfo(order));
  return new NextResponse(formatGenerationPrompts(order, upload), { headers: { "content-type": "text/plain; charset=utf-8", "content-disposition": `attachment; filename="prompts-${order.id}.txt"` } });
}

async function handleAdminCleanupGET(request: Request) {
  const { adminUnauthorized } = await import("@/lib/admin");
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  if (process.env.STORAGE_DRIVER === "supabase") {
    const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("orders").select("id, status, created_at, order_payload->customer_name, order_payload->customer_phone").order("created_at", { ascending: false });
    if (error) return jsonError(error.message, 500);
    const orders = (data ?? []).map((row: Record<string, unknown>) => ({ id: row.id, status: row.status, created_at: row.created_at, customer_name: row.customer_name, customer_phone: row.customer_phone }));
    const toDelete = orders.filter((o) => o.status !== "completed");
    return NextResponse.json({ total: orders.length, completed: orders.filter((o) => o.status === "completed").length, toDeleteCount: toDelete.length, toDelete });
  }
  // COS / 本地 JSON 模式
  const { listLocalOrders } = await import("@/services/localStore");
  const orders = await listLocalOrders();
  const toDelete = orders.filter((o) => o.status !== "completed");
  return NextResponse.json({ total: orders.length, completed: orders.filter((o) => o.status === "completed").length, toDeleteCount: toDelete.length, toDelete });
}

async function handleAdminCleanupDELETE(request: Request) {
  const { adminUnauthorized } = await import("@/lib/admin");
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  if (process.env.STORAGE_DRIVER === "supabase") {
    const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
    const supabase = getSupabaseAdmin();
    const { data, error: listError } = await supabase.from("orders").select("id, status").neq("status", "completed");
    if (listError) return jsonError(listError.message, 500);
    const ids = (data ?? []).map((row: { id: string }) => row.id);
    if (ids.length === 0) return NextResponse.json({ ok: true, deleted: 0 });
    const { error: deleteError } = await supabase.from("orders").delete().in("id", ids);
    if (deleteError) return jsonError(deleteError.message, 500);
    return NextResponse.json({ ok: true, deleted: ids.length, ids });
  }
  // COS / 本地 JSON 模式
  const { listLocalOrders, deleteLocalOrder } = await import("@/services/localStore");
  const orders = await listLocalOrders();
  const ids = orders.filter((o) => o.status !== "completed").map((o) => o.id);
  for (const id of ids) await deleteLocalOrder(id);
  return NextResponse.json({ ok: true, deleted: ids.length, ids });
}

// ─── Redeem code handler ───────────────────────────────────────────────────────

async function handleRedeemCodePOST(request: Request) {
  const { payLocalOrder, getLocalOrder } = await import("@/services/localStore");
  const { validateCode, redeemCode } = await import("@/services/codes");
  try {
    const body = await request.json();
    const { code, orderId } = body;
    if (!code || typeof code !== "string") return jsonError("请输入兑换码");
    if (!orderId || typeof orderId !== "string") return jsonError("订单ID缺失");

    const order = await getLocalOrder(orderId);
    if (!order) return jsonError("订单不存在", 404);

    const found = await validateCode(code.trim());
    if (!found) return jsonError("兑换码无效或已被使用", 400);

    const ok = await redeemCode(code.trim(), order.customer_name ?? "未知", orderId);
    if (!ok) return jsonError("兑换失败，请稍后重试", 500);

    // 兑换成功后，自动确认试看费支付 → 状态进到 ready_to_generate
    await payLocalOrder(orderId, "deposit", `redeem-${code.trim()}-${Date.now()}`);

    // 后台启动 AI 生成。即使函数返回后被 Vercel 冻结/中断，
    // 状态页每 60 秒的轮询也会检测到 ready_to_generate 并自动续交（已缓存参考图 URL）。
    const { generateOrderPreviews } = await import("@/services/generation");
    void (async () => {
      try {
        await generateOrderPreviews(orderId, { source: "admin" });
      } catch (e) {
        console.error("[redeem-auto-generation] failed:", e);
      }
    })();

    return NextResponse.json({ ok: true, message: "兑换成功！系统正在后台自动开始生成，请稍后在状态页查看进度。", redirectTo: `/orders/${orderId}/status` });
  } catch {
    return jsonError("请求格式错误", 400);
  }
}

// ─── Main router ──────────────────────────────────────────────────────────────

export async function GET(request: Request, context: Context) {
  const { slug = [] } = await context.params;
  let p: Record<string, string> | null;

  // GET /api/health
  if ((p = match(slug, "health"))) return handleHealthGET();
  // GET /api/orders/:id
  if ((p = match(slug, "orders", ":id"))) return handleOrderByIdGET(p.id);
  // GET /api/orders/:id/wechat-query
  if ((p = match(slug, "orders", ":id", "wechat-query"))) return handleOrderWechatQueryGET(request, p.id);
  // GET /api/download/:assetId
  if ((p = match(slug, "download", ":assetId"))) return handleDownloadGET(request, p.assetId);
  // GET /api/admin/orders
  if ((p = match(slug, "admin", "orders"))) return handleAdminOrdersGET(request);
  // GET /api/admin/orders/:id/task-prompts
  if ((p = match(slug, "admin", "orders", ":id", "task-prompts"))) return handleAdminTaskPromptsGET(request, p.id);
  // GET /api/admin/cleanup
  if ((p = match(slug, "admin", "cleanup"))) return handleAdminCleanupGET(request);

  return jsonError("Not found", 404);
}

export async function POST(request: Request, context: Context) {
  const { slug = [] } = await context.params;
  let p: Record<string, string> | null;

  // POST /api/orders
  if ((p = match(slug, "orders"))) return handleOrdersPOST(request);
  // POST /api/orders/presign （浏览器直传 COS 的预签名凭证）
  if ((p = match(slug, "orders", "presign"))) return handleOrdersPresignPOST(request);
  // POST /api/orders/:id/themes
  if ((p = match(slug, "orders", ":id", "themes"))) return handleOrderThemesPOST(request, p.id);
  // POST /api/orders/:id/selection
  if ((p = match(slug, "orders", ":id", "selection"))) return handleOrderSelectionPOST(request, p.id);
  // POST /api/orders/:id/poll-generation
  if ((p = match(slug, "orders", ":id", "poll-generation"))) return handleOrderPollGenerationPOST(p.id);
  // POST /api/orders/:id/id-photo-poll
  if ((p = match(slug, "orders", ":id", "id-photo-poll"))) return handleOrderIdPhotoPollPOST(p.id);
  // POST /api/orders/:id/selection-view
  if ((p = match(slug, "orders", ":id", "selection-view"))) return handleOrderSelectionViewPOST(p.id);
  // POST /api/payments/mock
  if ((p = match(slug, "payments", "mock"))) return handlePaymentsMockPOST(request);
  // POST /api/payments/wechat/create
  if ((p = match(slug, "payments", "wechat", "create"))) return handlePaymentsWechatCreatePOST(request);
  // POST /api/payments/wechat/notify
  if ((p = match(slug, "payments", "wechat", "notify"))) return handlePaymentsWechatNotifyPOST(request);
  // POST /api/redeem-code
  if ((p = match(slug, "redeem-code"))) return handleRedeemCodePOST(request);
  // POST /api/admin/orders/:id/start-generation
  if ((p = match(slug, "admin", "orders", ":id", "start-generation"))) return handleAdminStartGenerationPOST(request, p.id);
  // POST /api/admin/orders/:id/poll-generation
  if ((p = match(slug, "admin", "orders", ":id", "poll-generation"))) return handleAdminPollGenerationPOST(request, p.id);
  // POST /api/admin/orders/:id/complete-generation
  if ((p = match(slug, "admin", "orders", ":id", "complete-generation"))) return handleAdminCompleteGenerationPOST(request, p.id);
  // POST /api/admin/orders/:id/generated-results
  if ((p = match(slug, "admin", "orders", ":id", "generated-results"))) return handleAdminGeneratedResultsPOST(request, p.id);
  // POST /api/admin/orders/:id/regenerate-watermarks
  if ((p = match(slug, "admin", "orders", ":id", "regenerate-watermarks"))) return handleAdminRegenerateWatermarksPOST(request, p.id);

  return jsonError("Not found", 404);
}

export async function PATCH(request: Request, context: Context) {
  const { slug = [] } = await context.params;
  let p: Record<string, string> | null;

  // PATCH /api/admin/orders/:id
  if ((p = match(slug, "admin", "orders", ":id"))) return handleAdminOrderByIdPATCH(request, p.id);

  return jsonError("Not found", 404);
}

export async function DELETE(request: Request, context: Context) {
  const { slug = [] } = await context.params;
  let p: Record<string, string> | null;

  // DELETE /api/admin/orders/:id
  if ((p = match(slug, "admin", "orders", ":id"))) return handleAdminOrderByIdDELETE(request, p.id);
  // DELETE /api/admin/cleanup
  if ((p = match(slug, "admin", "cleanup"))) return handleAdminCleanupDELETE(request);

  return jsonError("Not found", 404);
}
