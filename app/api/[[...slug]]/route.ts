/**
 * Unified API catch-all route
 * All /api/* requests are handled here to stay within Vercel Hobby Plan's 12 serverless function limit.
 * Route matching: /api/[...segments]
 */
import { NextResponse } from "next/server";

type Context = { params: Promise<{ slug?: string[] }> };

function jsonError(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

// 生成任务提交（上传参考图 + 调用 APIMart 创建任务）约需 15-30 秒，
// 默认 10 秒超时会被 Vercel 杀掉，故统一放宽到 60 秒（Hobby 上限）。
export const maxDuration = 60;

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
  const { addLocalAsset, createLocalOrder, updateLocalUploadedPhotos } = await import("@/services/localStore");
  const { readStoredFile, saveUpload } = await import("@/services/storage");
  const { imageMetadataFromBuffer } = await import("@/services/watermark");
  type UploadedPersonPhoto = import("@/lib/types").UploadedPersonPhoto;

  async function savePersonUpload(orderId: string, file: File, role: "bride" | "groom", sortOrder: number) {
    const stored = await saveUpload(file, orderId, role);
    const metadata = await imageMetadataFromBuffer(await readStoredFile(stored.relativePath));
    const updated = await addLocalAsset(orderId, { kind: "upload", person_role: role, original_path: stored.relativePath, preview_path: null, mime_type: stored.mimeType, width: metadata.width, height: metadata.height, generation_prompt: null, theme_id: null, theme_name: null, prompt_id: null, prompt_name: null, aspect_ratio: null, is_cover_prompt: false, generation_type: null, generation_provider: null, generation_model: null, generation_task_id: null, generation_status: null, generation_error: null, prompt_index: null, sort_order: sortOrder, is_selected: false, is_unlocked: true });
    const asset = updated?.order_assets.find((item) => item.kind === "upload" && item.person_role === role && item.original_path === stored.relativePath);
    const photo: UploadedPersonPhoto = { originalName: file.name, path: stored.relativePath, url: asset ? `/api/download/${asset.id}` : stored.relativePath, mimeType: stored.mimeType, size: file.size };
    return photo;
  }

  function uploadConfigDetail() {
    return [`STORAGE_DRIVER=${appConfig.storageDriver}`, `SUPABASE_URL configured: ${Boolean(appConfig.supabaseUrl)}`, `SERVICE_ROLE configured: ${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}`, `BUCKET configured: ${Boolean(appConfig.supabaseStorageBucket)}`].join("; ");
  }

  try {
    const formData = await request.formData();
    const customerName = formData.get("customerName");
    if (typeof customerName !== "string" || !customerName.trim()) return jsonError("请填写姓名，方便后台识别订单", 400);
    const bridePhoto = formData.get("bridePhoto");
    const groomPhoto = formData.get("groomPhoto");
    if (!(bridePhoto instanceof File) || bridePhoto.size === 0) {
      if (!(groomPhoto instanceof File) || groomPhoto.size === 0) return jsonError("请分别上传新娘和新郎正脸照", 400);
      return jsonError("请上传新娘正脸照", 400);
    }
    if (!(groomPhoto instanceof File) || groomPhoto.size === 0) return jsonError("请上传新郎正脸照", 400);
    const order = await createLocalOrder({ customerName: formData.get("customerName"), customerPhone: formData.get("customerPhone"), customerEmail: formData.get("customerEmail"), photoType: formData.get("photoType") });
    const bride = await savePersonUpload(order.id, bridePhoto, "bride", 0);
    const groom = await savePersonUpload(order.id, groomPhoto, "groom", 1);
    await updateLocalUploadedPhotos(order.id, { bride, groom });
    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("POST /api/orders failed:", message);
    return NextResponse.json({ error: message || "创建订单失败，请稍后重试。", detail: uploadConfigDetail() }, { status: 500 });
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
  const { pollApiGeneration } = await import("@/services/generation");
  const { getLocalOrder } = await import("@/services/localStore");
  const current = await getLocalOrder(id);
  if (!current) return jsonError("Order not found", 404);
  if (current.status !== "generating" || !current.generation_jobs?.length) {
    return NextResponse.json({ ok: true, status: current.status, generatedCount: current.order_assets.filter((a) => a.kind === "generated").length });
  }
  try {
    const order = await pollApiGeneration(id);
    return NextResponse.json({ ok: true, status: order?.status, generatedCount: order?.order_assets.filter((a) => a.kind === "generated").length ?? 0 });
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
    // 注意：不在此处触发生成。微信要求回调必须在数秒内返回 SUCCESS，
    // 否则会重复通知。生成由状态页每 60 秒的自动轮询（poll-generation
    // 自愈逻辑）在用户停留在状态页时自动补启动。
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
  const { adminUnauthorized } = await import("@/lib/admin");
  const { getGenerationRuntimeConfig, pollApiGeneration, generateOrderPreviews } = await import("@/services/generation");
  const { getLocalOrder } = await import("@/services/localStore");
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  try {
    const current = await getLocalOrder(id);
    const runtimeConfig = current ? getGenerationRuntimeConfig(current) : null;
    console.log("[poll-generation] api precheck", { orderId: id, status: current?.status, effectiveLimit: runtimeConfig?.effectiveLimit, planLength: runtimeConfig?.planLength, plannedTaskCount: runtimeConfig?.plannedTaskCount, resolution: runtimeConfig?.apimartResolution, timeoutMs: runtimeConfig?.apimartTimeoutMs, generationJobsCount: current?.generation_jobs?.length ?? 0, generatedAssetsCount: current?.order_assets.filter((a) => a.kind === "generated").length ?? 0 });
    // 自愈：订单已付款（ready_to_generate）但尚未提交任何生成任务时，
    // 由状态页的自动轮询（每 60 秒）补启动生成。这样即便触发入口的
    // 后台任务被 Serverless 环境中断，也能靠客户端轮询自动救回。
    if (current && current.status === "ready_to_generate" && (!current.generation_jobs || current.generation_jobs.length === 0)) {
      try {
        await generateOrderPreviews(id, { source: "admin" });
      } catch (e) {
        console.error("[poll-auto-start] failed:", e);
      }
    }
    const order = await pollApiGeneration(id);
    return NextResponse.json({ ok: true, status: order?.status, generatedCount: order?.order_assets.filter((a) => a.kind === "generated").length ?? 0, pendingCount: order?.generation_jobs?.filter((job) => job.status !== "completed" && job.status !== "failed").length ?? 0, generationJobsCount: order?.generation_jobs?.length ?? 0 });
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

    // 同步启动 AI 生成（使用 admin 源触发完整生成流程）。
    // 注意：必须在 return 之前 await 完成，否则 Vercel 会在响应返回后
    // 冻结函数、掐断后台任务，导致生成任务从未被提交。
    const { generateOrderPreviews } = await import("@/services/generation");
    try {
      await generateOrderPreviews(orderId, { source: "admin" });
    } catch (e) {
      console.error("[redeem-auto-generation] failed:", e);
    }

    return NextResponse.json({ ok: true, message: "兑换成功！正在准备生成照片…", redirectTo: `/orders/${orderId}/status` });
  } catch (e) {
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
