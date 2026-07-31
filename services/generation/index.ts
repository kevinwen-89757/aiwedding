import path from "node:path";
import { randomUUID } from "node:crypto";
import { appConfig } from "@/lib/config";
import type { GenerationJob, OrderAsset } from "@/lib/types";
import { addLocalAsset, clearLocalGeneratedAssets, getLocalOrder, updateLocalOrder, updateLocalOrderStatus } from "@/services/localStore";
import type { LocalOrder } from "@/services/localStore";
import { generateWeddingImage } from "@/services/gemini";
import { buildPreviewGenerationPlan, getSelectedThemes } from "@/services/prompts";
import { readStoredFile, saveGeneratedImage, saveGeneratedImageBuffer, saveGeneratedUpload, savePreviewImageBuffer, overwriteStoredBuffer, isS3Storage, generatedOriginalRelativePath, previewRelativePath, existsS3Object } from "@/services/storage";
import { createWatermarkedPreviewBuffer, imageMetadataFromBuffer } from "@/services/watermark";
import { apimartCreateGenerationTask, apimartDownloadImage, apimartGetTaskStatus, apimartUploadImage } from "@/services/generation/providers/apimart";

export type GenerationTaskItem = {
  imageNumber: number;
  generationType: NonNullable<OrderAsset["generation_type"]>;
  themeId: string | null;
  themeName: string;
  promptId: string | null;
  promptName: string;
  isCoverPrompt: boolean;
  aspectRatio: string | null;
  rawPrompt: string;
};

export const runtimeIdentityInstruction = [
  "Use the uploaded clear front-facing portrait as identity reference.",
  "Keep identity and facial features consistent.",
  "Generate a tasteful realistic wedding or portrait photo.",
  "No text, no logos, no watermark, no extra people."
].join("\n");

export function buildRuntimeGenerationPrompt(rawPrompt: string) {
  return [rawPrompt, runtimeIdentityInstruction].join("\n\n");
}

export function getOrderGenerationPlan(order: Pick<LocalOrder, "selected_theme_ids">): GenerationTaskItem[] {
  return buildPreviewGenerationPlan(order.selected_theme_ids ?? []).map((item, index) => ({
    imageNumber: index + 1,
    generationType: item.type,
    themeId: item.theme.themeId,
    themeName: item.theme.themeName,
    promptId: item.prompt.id,
    promptName: item.prompt.name,
    isCoverPrompt: item.isCoverPrompt,
    aspectRatio: item.prompt.aspectRatio,
    rawPrompt: item.prompt.rawPrompt ?? item.prompt.prompt
  }));
}

export function getReferenceUploadAssets(order: Pick<LocalOrder, "order_assets" | "id_photo_assets">) {
  // 优先使用已生成的证件照底图（生活照转证件照后的结果）
  if (order.id_photo_assets?.bride || order.id_photo_assets?.groom) {
    return {
      bride: order.id_photo_assets.bride ?? null,
      groom: order.id_photo_assets.groom ?? null,
      primary: order.id_photo_assets.bride ?? order.id_photo_assets.groom ?? null
    };
  }
  // 回退到原始上传照片
  const uploads = order.order_assets.filter((asset) => asset.kind === "upload");
  const bride = uploads.find((asset) => asset.person_role === "bride") ?? uploads[0] ?? null;
  const groom = uploads.find((asset) => asset.person_role === "groom") ?? uploads.find((asset) => asset.id !== bride?.id) ?? null;
  return { bride, groom, primary: bride ?? groom ?? null };
}

export function generationTypeLabel(type: OrderAsset["generation_type"]) {
  if (type === "normal") return "常规预览";
  if (type === "sweet_spot") return "甜点首图";
  if (type === "manual_extra") return "人工补充";
  return "未记录类型";
}

export function formatGenerationPrompts(order: LocalOrder, uploadAsset?: OrderAsset | null) {
  const references = getReferenceUploadAssets(order);
  const selectedThemes = order.selected_theme_ids?.length ? getSelectedThemes(order.selected_theme_ids).map((theme) => theme.themeName).join("、") : "未选择";
  const lines = [
    `订单号：${order.id}`,
    `新娘上传照片：${references.bride?.original_path ?? uploadAsset?.original_path ?? "未找到新娘上传原图"}`,
    `新郎上传照片：${references.groom?.original_path ?? "未找到新郎上传原图"}`,
    `已选风格：${selectedThemes}`,
    ""
  ];
  for (const item of getEffectiveOrderGenerationPlan(order)) {
    lines.push(`【图 ${item.imageNumber}｜${generationTypeLabel(item.generationType)}｜${item.themeName}｜${item.promptName}】`);
    lines.push(item.rawPrompt);
    lines.push("");
  }
  return lines.join("\n");
}

export function buildOrderInfo(order: LocalOrder) {
  return {
    orderId: order.id,
    runtimeConfig: getGenerationRuntimeConfig(order),
    selectedThemes: getSelectedThemes(order.selected_theme_ids ?? []).map((theme) => ({
      themeId: theme.themeId,
      themeName: theme.themeName
    })),
    generationPlan: getEffectiveOrderGenerationPlan(order),
    createdAt: order.created_at
  };
}

export async function prepareGenerationPlan(order: LocalOrder) {
  if (!order.selected_theme_ids?.length) throw new Error("当前订单未选择风格，请先选择风格后再生成。");
  await clearLocalGeneratedAssets(order.id);
  return updateLocalOrderStatus(order.id, "ready_to_generate");
}

export async function mockGenerate(order: LocalOrder) {
  const uploadAsset = getReferenceUploadAssets(order).primary;
  if (!uploadAsset) throw new Error("Upload image not found");
  if (!order.selected_theme_ids?.length) throw new Error("当前订单未选择风格，请先选择风格后再生成。");

  await updateLocalOrderStatus(order.id, "generating");
  await clearLocalGeneratedAssets(order.id);
  const reference = await readStoredFile(uploadAsset.original_path);
  const plan = getOrderGenerationPlan(order);
  for (let index = 0; index < plan.length; index += 1) {
    const item = plan[index];
    const imageBuffer = await generateWeddingImage(reference, uploadAsset.mime_type, buildRuntimeGenerationPrompt(item.rawPrompt), index);
    const generated = await saveGeneratedImage(imageBuffer, order.id, index);
    const preview = await savePreviewImageBuffer(await createWatermarkedPreviewBuffer(imageBuffer), order.id, item.imageNumber);
    const metadata = await imageMetadataFromBuffer(imageBuffer);
    await addLocalAsset(order.id, {
      kind: "generated",
      original_path: generated.relativePath,
      preview_path: preview.relativePath,
      mime_type: generated.mimeType,
      width: metadata.width,
      height: metadata.height,
      generation_prompt: item.rawPrompt,
      theme_id: item.themeId,
      theme_name: item.themeName,
      prompt_id: item.promptId,
      prompt_name: item.promptName,
      aspect_ratio: item.aspectRatio,
      is_cover_prompt: item.isCoverPrompt,
      generation_type: item.generationType,
      prompt_index: index,
      sort_order: item.imageNumber,
      is_selected: false,
      is_unlocked: false
    });
  }
  return updateLocalOrderStatus(order.id, "pending_selection") as Promise<LocalOrder | null>;
}

function applyGenerationTestLimit(plan: GenerationTaskItem[]) {
  const limit = appConfig.generationTestLimit;
  if (!limit || !Number.isFinite(limit) || limit < 1) return plan;
  return plan.slice(0, limit);
}

export function getEffectiveOrderGenerationPlan(order: Pick<LocalOrder, "selected_theme_ids">) {
  return applyGenerationTestLimit(getOrderGenerationPlan(order));
}

export function getGenerationRuntimeConfig(order: Pick<LocalOrder, "selected_theme_ids" | "generation_resolution">) {
  const planLength = getEffectiveOrderGenerationPlan(order).length;
  const resolution = (order.generation_resolution ?? appConfig.apimartResolution) as string;
  return {
    generationTestLimit: Number.isFinite(appConfig.generationTestLimit) ? appConfig.generationTestLimit : null,
    effectiveLimit: Number.isFinite(appConfig.generationTestLimit) ? appConfig.generationTestLimit : null,
    apimartResolution: resolution,
    apimartTimeoutMs: Number.isFinite(appConfig.apimartTimeoutMs) ? appConfig.apimartTimeoutMs : 300000,
    planLength,
    plannedTaskCount: planLength
  };
}

function apiProgressNote(lines: string[], resolution?: string) {
  const res = resolution ?? appConfig.apimartResolution;
  return [`API 生成记录`, `模式：${appConfig.generationMode}`, `Provider：${appConfig.generationProvider ?? "未配置"}`, `模型：${appConfig.apimartModel}`, `resolution=${res}`, `timeoutMs=${Number.isFinite(appConfig.apimartTimeoutMs) ? appConfig.apimartTimeoutMs : 300000}`, `GENERATION_TEST_LIMIT=${Number.isFinite(appConfig.generationTestLimit) ? appConfig.generationTestLimit : "未设置"}`, ...lines].join("\n");
}

function appendApiProgressNoteText(current: string | null, lines: string[]) {
  const base = current?.startsWith("API 生成记录") ? current : apiProgressNote([]);
  const next = [base, ...lines].filter(Boolean).join("\n");
  return next.length > 10000 ? next.slice(next.length - 10000) : next;
}

function hasAssetForTask(order: LocalOrder, taskId: string) {
  return order.order_assets.some((asset) => asset.kind === "generated" && asset.generation_task_id === taskId);
}

function errorSummary(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "未知错误");
  return message.length > 500 ? `${message.slice(0, 500)}...` : message;
}

/**
 * 把「本单累计向 APIMart 发起创建任务的次数」写回 metadata（单调递增，只增不减）。
 * ⚠️ orders.json 是最后写赢、无并发控制的：generation_jobs 可能被并发写覆盖导致
 * 计数归零、熔断失效 → 重复创建重复扣费。这个 metadata 计数器是第二道账本，
 * 与 jobs 计数取 max 后作为熔断依据。
 */
function withCreateCount(metadata: Record<string, unknown> | undefined, count: number): Record<string, unknown> {
  const prev = Number(metadata?.apimartCreateCount ?? 0);
  return { ...(metadata ?? {}), apimartCreateCount: Math.max(prev, count) };
}

function buildGenerationJob(item: GenerationTaskItem, index: number, input: {
  taskId: string;
  status: GenerationJob["status"];
  error: string | null;
  resultImageUrl?: string | null;
  resolution?: string;
  /** 这张图累计创建次数（重提时由调用方 +1 传入），缺省为首次创建 = 1 */
  createAttempt?: number;
}): GenerationJob {
  const now = new Date().toISOString();
  return {
    provider: "apimart",
    task_id: input.taskId,
    image_number: item.imageNumber,
    status: input.status,
    poll_count: 0,
    create_attempt: input.createAttempt ?? 1,
    result_image_url: input.resultImageUrl ?? null,
    error: input.error,
    theme_id: item.themeId,
    theme_name: item.themeName,
    prompt_id: item.promptId,
    prompt_name: item.promptName,
    aspect_ratio: item.aspectRatio,
    is_cover_prompt: item.isCoverPrompt,
    generation_type: item.generationType,
    prompt_index: index,
    raw_prompt: item.rawPrompt,
    resolution: input.resolution ?? appConfig.apimartResolution,
    created_at: now,
    updated_at: now
  };
}

function recoverLegacyApiJobs(order: LocalOrder) {
  const matches = Array.from((order.admin_note ?? "").matchAll(/图\s*(\d+)\s*task_id[：:]\s*([^\s]+)/g));
  if (!matches.length) return [];
  const plan = getOrderGenerationPlan(order);
  const now = new Date().toISOString();
  // 按 image_number 去重，只保留最后一个（最新）task_id
  const latestByNumber = new Map<number, RegExpMatchArray>();
  for (const m of matches) {
    const num = Number.parseInt(m[1], 10);
    latestByNumber.set(num, m);
  }
  return Array.from(latestByNumber.values()).map((match) => {
    const imageNumber = Number.parseInt(match[1], 10);
    const planItem = plan[imageNumber - 1];
    return {
      provider: "apimart" as const,
      task_id: match[2],
      image_number: imageNumber,
      status: "created" as const,
      poll_count: 0,
      result_image_url: null,
      error: null,
      theme_id: planItem?.themeId ?? null,
      theme_name: planItem?.themeName ?? null,
      prompt_id: planItem?.promptId ?? null,
      prompt_name: planItem?.promptName ?? null,
      aspect_ratio: planItem?.aspectRatio ?? null,
      is_cover_prompt: planItem?.isCoverPrompt ?? false,
      generation_type: planItem?.generationType ?? null,
      prompt_index: planItem ? imageNumber - 1 : null,
      raw_prompt: planItem?.rawPrompt ?? null,
      resolution: appConfig.apimartResolution,
      created_at: now,
      updated_at: now
    };
  });
}

export async function apiGenerate(order: LocalOrder) {
  return startApiGeneration(order);
}

export async function startApiGeneration(order: LocalOrder) {
  if (appConfig.generationProvider !== "apimart") throw new Error("GENERATION_PROVIDER 未配置为 apimart。");
  if (!appConfig.apimartApiKey) throw new Error("APIMART_API_KEY 未配置，无法调用 APIMart 生成。");
  const references = getReferenceUploadAssets(order);
  const { bride, groom } = references;
  if (!bride || !groom) throw new Error("缺少新娘或新郎正脸照，无法生成。");
  if (!order.selected_theme_ids?.length) throw new Error("当前订单未选择风格，请先选择风格后再生成。");
  const plan = getEffectiveOrderGenerationPlan(order);
  if (!plan.length) throw new Error("没有可执行的生成计划。");
  const runtimeConfig = getGenerationRuntimeConfig(order);

  // 卡死任务自愈：APIMart 异步队列在拥堵/超时时可能静默丢弃任务（表现为任务长时间
  // 停留在 polling/created 但永远不完成）。这类任务已无法靠轮询救回，必须移除后用
  // 相同 prompt 重新提交（参考图 URL 已缓存在 metadata，不重复上传）。
  // 阈值：任务创建超过 20 分钟，或已轮询 >= 40 次仍无结果。
  const nowTs = Date.now();
  // ⚠️ 阈值已从 20 分钟上调到 90 分钟：4K 生成本身就需要 20~40 分钟，
  // 旧阈值会把「还在正常生成」的任务误判为卡死并删除重提，导致：
  //   ① 误杀在跑任务（APIMart 其实在算）；② 重提受 38s 预算限制只重建一部分 → 永久丢图。
  // 只有在跑超过 90 分钟（或轮询 ≥60 次）仍无结果，才视为被 APIMart 静默丢弃。
  const STUCK_TASK_AGE_MS = Number(process.env.STUCK_TASK_AGE_MS ?? 90 * 60 * 1000);
  const STUCK_TASK_POLL_THRESHOLD = Number(process.env.STUCK_TASK_POLL_THRESHOLD ?? 60);
  // 创建失败（task_id 以 create-failed-/empty-prompt- 开头）是「从未真正提交到 APIMart」的任务
  // （多为网络瞬时错），与生成失败不同，可安全用相同 prompt 重新提交，直到成功。
  // ⚠️ 例外：余额不足（HTTP 402 insufficient balance）在充值前重提必然再次失败，
  // 会导致「402失败→移除→重提→又402」的无限死循环（疯狂刷屏 + 空烧 APIMart 请求）。
  // 因此这类失败判为「不可重试终态」，保留 failed 状态、等充值后由人工/下次轮询恢复。
  const isBalanceFailure = (j: { error?: string | null }) => {
    const msg = (j.error ?? "").toLowerCase();
    return msg.includes("insufficient balance") || msg.includes("402") || msg.includes("top up") || msg.includes("余额不足");
  };
  const isCreationFailure = (j: { status: string; task_id: string; error?: string | null }) =>
    j.status === "failed" &&
    (j.task_id.startsWith("create-failed-") || j.task_id.startsWith("empty-prompt-")) &&
    !isBalanceFailure(j);

  // ============ 计费护栏（2026-08-01 加固）============
  // ⚠️ 事故背景：APIMart 每次「创建任务」成功都实时扣费（4K 约 $0.05/张）。
  // 此前重提逻辑没有任何次数上限，一张卡住的图会被状态页每 60s 轮询反复
  // 「移除→重新创建→再卡住→再移除」，每一轮都真实扣费，可在数小时内烧光余额。
  // 现在设三道刹车：
  //   1) 单图上限 MAX_CREATE_ATTEMPTS：同一张图最多创建 N 次，超过转 failed 终态；
  //   2) 订单级总预算 CREATE_BUDGET_RATIO：全单累计创建次数 ≤ 计划数 × 比例，超过熔断；
  //   3) 余额不足（402）永不重提（isBalanceFailure，充值前重提必然再失败）。
  const MAX_CREATE_ATTEMPTS = Number(process.env.MAX_CREATE_ATTEMPTS ?? 2);
  const CREATE_BUDGET_RATIO = Number(process.env.CREATE_BUDGET_RATIO ?? 1.5);

  // 每张图历史累计创建次数（历史数据无该字段时视为 1）
  const attemptByImage = new Map<number, number>();
  for (const j of order.generation_jobs ?? []) {
    const prev = attemptByImage.get(j.image_number) ?? 0;
    attemptByImage.set(j.image_number, Math.max(prev, j.create_attempt ?? 1));
  }
  const jobsBasedCreateCount = Array.from(attemptByImage.values()).reduce((a, b) => a + b, 0);
  // ⚠️ orders.json 是「最后写赢」无并发控制：并发写可能覆盖掉 generation_jobs，
  // 导致基于 jobs 的计数被清零 → 熔断失效 → 重复创建重复扣费（这正是早期烧钱的机制）。
  // 因此额外维护一个写在 metadata 上的【单调递增】计数器，两者取最大值作为判断依据。
  const metaCreateCount = Number(order.metadata?.apimartCreateCount ?? 0);
  const totalCreateSoFar = Math.max(jobsBasedCreateCount, metaCreateCount);
  const orderCreateBudget = Math.ceil(plan.length * CREATE_BUDGET_RATIO);
  const budgetExhausted = totalCreateSoFar >= orderCreateBudget;
  // 本次运行的实时计数：每真正调用一次 APIMart「创建任务」就 +1，
  // 并随订单一起写回 metadata.apimartCreateCount（只增不减）。
  let createCallsMade = totalCreateSoFar;

  // 卡住/创建失败的任务，按「是否还有重试额度」分成两组
  // ⚠️ 关键修复（2026-08-01）：对「仍在轮询/创建中」的任务，绝不因超龄就删除重提。
  // 4K 生成本就需要 20~40 分钟，旧逻辑把这类慢任务当卡死删除，再叠加 38s 重提预算，
  // 只会重建一部分 → 永久丢图。现在只对「真正失败」的任务重提：
  //   ① 从未提交成功（create-failed/empty-prompt）；
  //   ② APIMart 显式返回 failed（非余额不足）；
  //   ③ 安全网：轮询/创建中超过 90 分钟 或 轮询 ≥60 次仍无结果（视为被静默丢弃）。
  const candidateStuck = (order.generation_jobs ?? []).filter(
    (j) =>
      isCreationFailure(j) ||
      (j.status === "failed" && !isBalanceFailure(j) && !j.task_id.startsWith("create-failed-") && !j.task_id.startsWith("empty-prompt-")) ||
      ((j.status === "polling" || j.status === "created") && (nowTs - Date.parse(j.created_at) > STUCK_TASK_AGE_MS || (j.poll_count ?? 0) >= STUCK_TASK_POLL_THRESHOLD))
  );
  // 还有额度 → 移除后重提；已达上限或订单预算耗尽 → 就地转 failed 终态（让订单能正常收尾）
  const stuckJobs = budgetExhausted ? [] : candidateStuck.filter((j) => (j.create_attempt ?? 1) < MAX_CREATE_ATTEMPTS);
  const exhaustedJobs = candidateStuck.filter((j) => !stuckJobs.some((s) => s.task_id === j.task_id));

  let orderForSubmit = order;
  if (stuckJobs.length || exhaustedJobs.length) {
    const nowIso = new Date().toISOString();
    const cleaned = await updateLocalOrder(order.id, (current) => {
      const notes: string[] = [];
      let nextJobs = current.generation_jobs ?? [];
      if (exhaustedJobs.length) {
        const nums = Array.from(new Set(exhaustedJobs.map((j) => j.image_number))).sort((a, b) => a - b);
        const reason = budgetExhausted
          ? `订单累计创建次数已达预算上限（${totalCreateSoFar}/${orderCreateBudget}），为避免继续扣费已停止重试。`
          : `已重试 ${MAX_CREATE_ATTEMPTS} 次仍未出图，为避免重复扣费已停止重试。`;
        nextJobs = nextJobs.map((j) =>
          exhaustedJobs.some((e) => e.task_id === j.task_id)
            ? { ...j, status: "failed" as const, error: reason, updated_at: nowIso }
            : j
        );
        notes.push(`图 ${nums.join(", ")}：${reason}`);
      }
      if (stuckJobs.length) {
        const stuckNumbers = stuckJobs.map((j) => j.image_number).sort((a, b) => a - b);
        nextJobs = nextJobs.filter((j) => !stuckJobs.some((s) => s.task_id === j.task_id));
        notes.push(`检测到 ${stuckJobs.length} 个任务卡在 ${stuckJobs[0].status} 超过阈值（最早创建于 ${stuckJobs[0].created_at}），已移除并准备重新提交：${stuckNumbers.join(", ")}`);
      }
      return { ...current, generation_jobs: nextJobs, admin_note: appendApiProgressNoteText(current.admin_note, notes) };
    });
    orderForSubmit = cleaned ?? order;
  }
  // 后续提交基于「已清理卡死任务」的订单对象进行（参考图/资产等其余字段不变）。
  order = orderForSubmit;

  // 订单级熔断：预算耗尽后不再创建任何新任务，直接按当前结果收尾，等待人工介入。
  if (budgetExhausted) {
    console.error("[start-generation] create budget exhausted, aborting submission", {
      orderId: order.id, totalCreateSoFar, orderCreateBudget, planLength: plan.length
    });
    const jobsNow = order.generation_jobs ?? [];
    const pendingNow = jobsNow.filter((j) => j.status !== "completed" && j.status !== "failed").length;
    await updateLocalOrder(order.id, (current) => ({
      ...current,
      status: pendingNow > 0 ? "generating" : (jobsNow.some((j) => j.status === "completed") ? "pending_selection" : "generation_failed"),
      admin_note: appendApiProgressNoteText(current.admin_note, [
        `⚠️ 计费熔断：本单累计创建任务 ${totalCreateSoFar} 次，已达预算上限 ${orderCreateBudget}（计划 ${plan.length} 张 × ${CREATE_BUDGET_RATIO}）。`,
        `已停止自动重试，避免继续消耗 APIMart 余额。如确需继续，请人工检查后手动处理。`
      ])
    }));
    return getLocalOrder(order.id);
  }

  // 时间预算：Serverless 函数有 60 秒硬上限。单次调用最多提交到预算点就主动
  // return，已提交的任务已落盘（见下方循环内的 updateLocalOrder），下一次轮询
  // 会自动续交剩余任务。这样无论后台手动点击还是自动轮询，单次请求都不会超过
  // Vercel 的 60 秒上限 → 不会再出现 504 网关超时。
  const generationTimeBudgetMs = Number(process.env.GENERATION_TIME_BUDGET_MS ?? 38000);
  const generationDeadline = Date.now() + generationTimeBudgetMs;

  // 断点续传：Serverless 函数有 60 秒上限，23 张图一次性提交会超时。
  // 若已有任务，说明是上一轮被中断后的续跑——不清空已生成资产、
  // 不重置任务列表，只补交尚未提交的任务。
  const existingJobs = order.generation_jobs ?? [];
  const submittedImageNumbers = new Set(existingJobs.map((j) => j.image_number));
  const remainingPlan = plan.filter((item) => !submittedImageNumbers.has(item.imageNumber));

  if (existingJobs.length === 0) {
    await updateLocalOrder(order.id, (current) => ({
      ...current,
      status: "generating",
      admin_note: apiProgressNote(["准备调用 APIMart。"], runtimeConfig.apimartResolution),
      generation_jobs: []
    }));
    await clearLocalGeneratedAssets(order.id);
  } else {
    await updateLocalOrderStatus(order.id, "generating", {
      admin_note: appendApiProgressNoteText(order.admin_note, ["检测到未提交完成的任务，继续补交剩余生成任务。"])
    });
  }

  // 复用已上传的参考照片 URL，避免每次断点续传都重新上传。
  // Vercel 函数只有 60 秒，23 张图分多次提交；参考照片上传一次即可。
  const cachedUrls = (order.metadata?.apimartReferenceUrls ?? {}) as { bride?: string; groom?: string };
  let brideImageUrl = cachedUrls.bride;
  let groomImageUrl = cachedUrls.groom;

  if (!brideImageUrl) {
    const brideReference = await readStoredFile(bride.original_path);
    console.log("[start-generation] uploading bride reference", { sizeKB: `${(brideReference.length / 1024).toFixed(0)}KB` });
    brideImageUrl = await apimartUploadImage({
      buffer: brideReference,
      mimeType: bride.mime_type,
      filename: path.basename(bride.original_path)
    });
    await updateLocalOrder(order.id, (current) => ({
      ...current,
      status: "generating",
      metadata: { ...(current.metadata ?? {}), apimartReferenceUrls: { ...(current.metadata?.apimartReferenceUrls ?? {}), bride: brideImageUrl } },
      admin_note: appendApiProgressNoteText(current.admin_note, ["新娘正脸照已上传到 AI 服务，准备上传新郎正脸照。"])
    }));
  }

  if (!groomImageUrl) {
    const groomReference = await readStoredFile(groom.original_path);
    console.log("[start-generation] uploading groom reference", { sizeKB: `${(groomReference.length / 1024).toFixed(0)}KB` });
    groomImageUrl = await apimartUploadImage({
      buffer: groomReference,
      mimeType: groom.mime_type,
      filename: path.basename(groom.original_path)
    });
    await updateLocalOrder(order.id, (current) => ({
      ...current,
      status: "generating",
      metadata: { ...(current.metadata ?? {}), apimartReferenceUrls: { ...(current.metadata?.apimartReferenceUrls ?? {}), groom: groomImageUrl } },
      admin_note: appendApiProgressNoteText(current.admin_note, ["新郎正脸照已上传到 AI 服务，开始创建生成任务。"])
    }));
  }

  console.log("[start-generation] reference photos ready", {
    orderId: order.id,
    plannedTaskCount: runtimeConfig.plannedTaskCount,
    planLength: plan.length,
    effectiveLimit: runtimeConfig.effectiveLimit,
    resolution: runtimeConfig.apimartResolution,
    timeoutMs: runtimeConfig.apimartTimeoutMs,
    brideCached: Boolean(cachedUrls.bride),
    groomCached: Boolean(cachedUrls.groom)
  });

  const jobs: GenerationJob[] = [...existingJobs];
  for (let index = 0; index < remainingPlan.length; index += 1) {
    const item = remainingPlan[index];
    // 时间预算守卫：超过预算则停止提交，剩余任务由下一次轮询自动续交
    // （循环结束后的汇总逻辑会正确写入「还有 X 个任务待提交，下次轮询自动续交」）。
    if (Date.now() >= generationDeadline) {
      console.log("[start-generation] time budget reached, stopping submission; remaining tasks continue on next poll", {
        orderId: order.id, submitted: jobs.length, remaining: remainingPlan.length - index
      });
      break;
    }
    // Guard: 跳过空 prompt，防止 APIMart 返回 400
    if (!item.rawPrompt || item.rawPrompt.trim().length === 0) {
      const message = `图 ${item.imageNumber} prompt 为空，已跳过。请检查「${item.themeName}」风格的「${item.promptName}」prompt 是否已填写。`;
      console.error("[apimart] empty prompt skipped", { orderId: order.id, imageNumber: item.imageNumber, themeName: item.themeName, promptName: item.promptName });
      const job = buildGenerationJob(item, index, {
        taskId: `empty-prompt-${order.id}-${item.imageNumber}`,
        status: "failed",
        error: message,
        resolution: runtimeConfig.apimartResolution,
        createAttempt: (attemptByImage.get(item.imageNumber) ?? 0) + 1
      });
      jobs.push(job);
      await updateLocalOrder(order.id, (current) => ({
        ...current,
        status: "generating",
        generation_jobs: jobs,
        admin_note: appendApiProgressNoteText(current.admin_note, [message])
      }));
      continue;
    }
    // 循环内二次熔断：一次运行里也可能因为大量重提而突破预算，这里逐张再判一次。
    if (createCallsMade >= orderCreateBudget) {
      console.error("[start-generation] create budget exhausted mid-loop, stopping submission", {
        orderId: order.id, createCallsMade, orderCreateBudget
      });
      await updateLocalOrder(order.id, (current) => ({
        ...current,
        generation_jobs: jobs,
        metadata: withCreateCount(current.metadata, createCallsMade),
        admin_note: appendApiProgressNoteText(current.admin_note, [
          `⚠️ 计费熔断：本单累计创建任务已达预算上限 ${orderCreateBudget}，剩余任务不再提交。`
        ])
      }));
      break;
    }
    await updateLocalOrder(order.id, (current) => ({
      ...current,
      status: "generating",
      generation_jobs: jobs,
      admin_note: appendApiProgressNoteText(current.admin_note, [
        `准备创建图 ${item.imageNumber} / ${plan.length}。`
      ])
    }));
    try {
      // ⚠️ 先记账再调用：APIMart 一旦创建成功就实时扣费，宁可多记一次也不能漏记。
      createCallsMade += 1;
      const task = await apimartCreateGenerationTask({
        prompt: item.rawPrompt,
        uploadedImageUrls: [brideImageUrl, groomImageUrl],
        aspectRatio: item.aspectRatio,
        resolution: runtimeConfig.apimartResolution
      });
      console.log("[apimart] task created", {
        orderId: order.id,
        taskId: task.taskId,
        index,
        imageNumber: item.imageNumber,
        themeName: item.themeName,
        aspectRatio: item.aspectRatio
      });
      const job = buildGenerationJob(item, index, {
        taskId: task.taskId,
        status: "created",
        error: null,
        resolution: runtimeConfig.apimartResolution,
        createAttempt: (attemptByImage.get(item.imageNumber) ?? 0) + 1
      });
      jobs.push(job);
      await updateLocalOrder(order.id, (current) => ({
        ...current,
        status: "generating",
        generation_jobs: jobs,
        metadata: withCreateCount(current.metadata, createCallsMade),
        admin_note: appendApiProgressNoteText(current.admin_note, [
          `图 ${item.imageNumber} task_id：${task.taskId}`,
          `图 ${item.imageNumber} 已进入 APIMart 队列，等待后续查询。`
        ])
      }));
    } catch (error) {
      const message = errorSummary(error);
      console.error("[apimart] task create failed", {
        orderId: order.id,
        index,
        imageNumber: item.imageNumber,
        error: message
      });
      const job = buildGenerationJob(item, index, {
        taskId: `create-failed-${order.id}-${item.imageNumber}`,
        status: "failed",
        error: message,
        resolution: runtimeConfig.apimartResolution,
        createAttempt: (attemptByImage.get(item.imageNumber) ?? 0) + 1
      });
      jobs.push(job);
      await updateLocalOrder(order.id, (current) => ({
        ...current,
        status: "generating",
        generation_jobs: jobs,
        metadata: withCreateCount(current.metadata, createCallsMade),
        admin_note: appendApiProgressNoteText(current.admin_note, [
          `图 ${item.imageNumber} 创建任务失败：${message}`
        ])
      }));
    }
  }

  const createdCount = jobs.filter((job) => job.status !== "failed").length;
  const failedCount = jobs.length - createdCount;
  const stillPending = plan.length - jobs.length;
  await updateLocalOrder(order.id, (current) => ({
    ...current,
    status: createdCount > 0 ? "generating" : "generation_failed",
    generation_jobs: jobs,
    metadata: withCreateCount(current.metadata, createCallsMade),
    admin_note: appendApiProgressNoteText(current.admin_note, [
      `本轮提交：计划 ${plan.length} 个，已提交 ${jobs.length} 个，失败 ${failedCount} 个。`,
      stillPending > 0
        ? `还有 ${stillPending} 个任务待提交，系统会在下次轮询时自动续交。`
        : "全部任务已提交，等待 APIMart 返回结果。",
      failedCount > 0 && createdCount === 0 ? "所有 APIMart 任务创建失败，订单已标记 generation_failed。" : ""
    ].filter(Boolean))
  }));
  return getLocalOrder(order.id);
}

type SavedGeneratedAsset = Omit<OrderAsset, "id" | "order_id" | "created_at">;

function buildGeneratedAsset(job: GenerationJob, originalPath: string, previewPath: string, mimeType: string, width: number | null, height: number | null): SavedGeneratedAsset {
  return {
    kind: "generated",
    original_path: originalPath,
    preview_path: previewPath,
    mime_type: mimeType,
    width,
    height,
    generation_prompt: job.raw_prompt,
    theme_id: job.theme_id,
    theme_name: job.theme_name,
    prompt_id: job.prompt_id,
    prompt_name: job.prompt_name,
    aspect_ratio: job.aspect_ratio,
    is_cover_prompt: job.is_cover_prompt,
    generation_type: job.generation_type,
    generation_provider: "apimart",
    generation_model: appConfig.apimartModel,
    generation_task_id: job.task_id,
    generation_status: "completed",
    generation_error: null,
    prompt_index: job.prompt_index,
    sort_order: job.image_number,
    is_selected: false,
    is_unlocked: false
  };
}

/**
 * 下载 APIMart 返回的图片并上传到 COS（原图 + 水印预览），返回资产描述符。
 * 注意：本函数【不】写订单元数据——写入由调用方（pollApiGeneration）在循环结束后
 * 统一批量写回，避免「每张图一次全量 orders.json 读写」在跨境 COS 下叠加超时。
 * 具备幂等：若 COS 中原图与预览都已存在（之前已成功上传，仅元数据写入失败），直接复用，
 * 跳过重复下载 4K 大图。
 */
async function saveCompletedApiJob(order: LocalOrder, job: GenerationJob, imageUrl: string, status: string, pendingAssets: SavedGeneratedAsset[] = []): Promise<{ asset: SavedGeneratedAsset | null; notes: string[] } | null> {
  // 用本轮已读取的订单对象查重（不再跨境重读 orders.json，每张省 2~5s）。
  // pendingAssets 是本轮已保存待写回的资产，一并查重防止同轮重复。
  const orderId = order.id;
  if (hasAssetForTask(order, job.task_id) || pendingAssets.some((a) => a.generation_task_id === job.task_id)) return null;
  // 同编号资产已存在 → 跳过
  if (
    order.order_assets.some((a) => a.kind === "generated" && a.sort_order === job.image_number) ||
    pendingAssets.some((a) => a.sort_order === job.image_number)
  ) {
    return { asset: null, notes: [`图 ${job.image_number} 已有同编号资产，跳过重复保存。`] };
  }

  const taskSuffix = job.task_id.replace(/^create-failed-/, "").slice(0, 8);

  // 幂等检查：COS 中原图 + 预览是否都已存在
  const previewPath = previewRelativePath(orderId, job.image_number, taskSuffix);
  if (isS3Storage()) {
    const originalCandidates = [
      generatedOriginalRelativePath(orderId, job.image_number - 1, "image/jpeg", taskSuffix),
      generatedOriginalRelativePath(orderId, job.image_number - 1, "image/png", taskSuffix)
    ];
    const origChecks = await Promise.all(originalCandidates.map((p) => existsS3Object(p)));
    const origExists = origChecks.some(Boolean);
    const prevExists = await existsS3Object(previewPath);
    if (origExists && prevExists) {
      const originalPath = originalCandidates[origChecks.indexOf(true)];
      const mimeType = originalPath.endsWith(".png") ? "image/png" : originalPath.endsWith(".webp") ? "image/webp" : "image/jpeg";
      return {
        asset: buildGeneratedAsset(job, originalPath, previewPath, mimeType, null, null),
        notes: [`图 ${job.image_number} 云端已存在生成图，跳过重复下载（幂等复用）。`]
      };
    }
  }

  const downloaded = await apimartDownloadImage(imageUrl);
  const mimeType = downloaded.mimeType || "image/jpeg";
  // 并行：上传原图 + 生成并上传预览图（节省 ~2-3 秒/张）
  const [generated, preview] = await Promise.all([
    saveGeneratedImageBuffer(downloaded.buffer, orderId, job.image_number - 1, mimeType, taskSuffix),
    (async () => {
      const previewBuf = await createWatermarkedPreviewBuffer(downloaded.buffer);
      return savePreviewImageBuffer(previewBuf, orderId, job.image_number, taskSuffix);
    })()
  ]);

  const metadata = await imageMetadataFromBuffer(downloaded.buffer);
  return {
    asset: buildGeneratedAsset(job, generated.relativePath, preview.relativePath, generated.mimeType, metadata.width, metadata.height),
    notes: [
      `图 ${job.image_number} 原图已保存到云端存储(COS)：${generated.relativePath}`,
      `图 ${job.image_number} 水印预览图已保存到云端存储(COS)：${preview.relativePath}`
    ]
  };
}

/** 给 Promise 加超时护栏：超时不代表任务失败，只是本轮不再等它（下次轮询幂等续传）。 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} 超过 ${Math.round(ms / 1000)}s 未完成，留待下次轮询续传`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

export async function pollApiGeneration(orderId: string) {
  // ⚠️ 预算必须从函数入口开始计时（包含订单读取 + APIMart 状态查询的耗时），
  // 否则前置耗时不计入预算，总时长冲破 Vercel 60s → 函数被杀 → 批量写回未执行 → 本轮全部白干。
  const pollStartedAt = Date.now();
  let order = await getLocalOrder(orderId);
  if (!order) throw new Error("Order not found");
  let jobs = order.generation_jobs ?? [];
  // 状态页本身已显示计划/已完成/进行中数量，这里不再往管理备注里刷屏。
  // 只有真正发生任务完成、失败等事件时才追加记录。
  if (!jobs.length) {
    const recovered = recoverLegacyApiJobs(order);
    if (recovered.length) {
      await updateLocalOrder(orderId, (current) => ({
        ...current,
        status: "generating",
        generation_jobs: recovered,
        admin_note: appendApiProgressNoteText(current.admin_note, [`已从历史生成记录恢复 ${recovered.length} 个 APIMart task_id，可继续查询。`])
      }));
      order = await getLocalOrder(orderId);
      jobs = order?.generation_jobs ?? [];
    }
  }
  if (!order) throw new Error("Order not found");
  if (!jobs.length) {
    // 生成任务还在后台提交中（如刚触发自动启动/重提），本轮无可查询任务，等下次轮询。
    if (order.status === "generating" || order.status === "ready_to_generate") return order;
    throw new Error("当前订单没有可查询的 APIMart task_id。");
  }
  const orderSnapshot: LocalOrder = order;

  // 并行查询所有未完成的 job（避免串行查询耗时过长）
  const jobsToPoll = jobs.filter((job) => job.status !== "completed" && job.status !== "failed");
  const pollResults = await Promise.all(
    jobsToPoll.map(async (job) => {
      const pollCount = job.poll_count + 1;
      try {
        const result = await apimartGetTaskStatus(job.task_id);
        return { job, result, ok: true as const, error: null as string | null, pollCount };
      } catch (err) {
        return { job, result: null, ok: false as const, error: errorSummary(err), pollCount };
      }
    })
  );

  // [DIAG] 诊断：单行紧凑汇总，避免被 Vercel 日志截断
  try {
    const byStatus: Record<string, number> = {};
    for (const r of pollResults) {
      const s = r.ok ? (r.result?.status ?? "unknown") : "query_error";
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    }
    const completed = pollResults.filter((r) => r.ok && ["completed", "complete", "success", "succeeded", "done"].includes(r.result?.status ?? "")).length;
    const sampleErr = pollResults.filter((r) => !r.ok).slice(0, 1).map((r) => String(r.error ?? "").slice(0, 120));
    console.error(`[poll-debug] total=${pollResults.length} byStatus=${JSON.stringify(byStatus)} completed_on_apimart=${completed} qErr=${pollResults.filter((r) => !r.ok).length}${sampleErr.length ? " err1=" + sampleErr[0] : ""}`);
  } catch { /* ignore */ }

  // 时间预算：从函数入口起算，总预算 ~150s（route maxDuration=300s，余量充足）。
  // ⚠️ 并行度必须小：Vercel Hobby 函数只有 1 vCPU，水印（sharp）是 CPU 密集操作，
  // 多张 4K 并行加水印会 CPU 排队导致全部超时（实测 6 并行 0 张成功）。
  // 一轮最多 2 张并行，单张限时 80s。状态页每 60s 自动触发轮询会重叠，
  // 候选随机打散让重叠轮询各自保存不同的图（自然分工），幂等机制保证不重不漏。
  const pollTimeBudgetMs = Number(process.env.POLL_TIME_BUDGET_MS ?? 150000);
  const pollDeadline = pollStartedAt + pollTimeBudgetMs;
  const SAVE_TIMEOUT_MS = Number(process.env.SAVE_TIMEOUT_MS ?? 60000);
  const MAX_SAVE_PER_POLL = Number(process.env.MAX_SAVE_PER_POLL ?? 2);
  const MAX_QUERY_ERROR_POLLS = Number(process.env.MAX_TASK_POLL_COUNT ?? 60);

  // 本轮累积的变更：统一在处理结束后「一次性」写回 orders.json，
  // 避免「每张图一次全量读写」在跨境 COS 下叠加超时（订单卡死/后台变慢的根因）。
  const pendingAssets: SavedGeneratedAsset[] = [];
  const jobUpdates: Array<{ task_id: string; status: GenerationJob["status"]; error: string | null; pollCount: number; resultImageUrl?: string | null }> = [];
  const notes: string[] = [];
  const saveCandidates: Array<{ job: GenerationJob; imageUrl: string; status: string; pollCount: number }> = [];

  for (const { job, result, ok, error, pollCount } of pollResults) {
    if (!ok) {
      // 查询报错 ≠ 生成失败（多为网络抖动/APIMart 瞬时 5xx）。
      // 只记录错误继续轮询；连续查询失败超过上限才判 failed。
      if (pollCount >= MAX_QUERY_ERROR_POLLS) {
        jobUpdates.push({ task_id: job.task_id, status: "failed", error, pollCount });
        notes.push(`图 ${job.image_number} 查询已达 ${pollCount} 次仍失败，标记失败：${error}`);
      } else {
        jobUpdates.push({ task_id: job.task_id, status: "polling", error, pollCount });
      }
      continue;
    }

    if (["completed", "complete", "success", "succeeded", "done"].includes(result!.status)) {
      if (!result!.imageUrl) {
        jobUpdates.push({ task_id: job.task_id, status: "failed", error: `APIMart 任务 ${job.task_id} 已完成，但没有返回结果图片 URL。`, pollCount });
        notes.push(`图 ${job.image_number} 生成失败：APIMart 返回 completed 但没有图片 URL`);
        continue;
      }
      // 先全部收集，稍后随机挑选 MAX_SAVE_PER_POLL 张保存
      saveCandidates.push({ job, imageUrl: result!.imageUrl, status: result!.status, pollCount });
    } else if (["failed", "failure", "cancelled", "canceled", "error"].includes(result!.status)) {
      jobUpdates.push({ task_id: job.task_id, status: "failed", error: `APIMart 返回失败状态：${result!.status}`, pollCount });
      notes.push(`图 ${job.image_number} 生成失败：APIMart 返回状态 ${result!.status}`);
    } else {
      jobUpdates.push({ task_id: job.task_id, status: "polling", error: null, pollCount });
    }
  }

  // 保存阶段：随机挑 MAX_SAVE_PER_POLL 张【并行】下载+上传。
  // 随机打散：状态页 60s 自动轮询与手动轮询会重叠，随机后各轮保存不同的图（自然分工）。
  // 每个候选 job 的 image_number 不同，写入的 COS 路径互不冲突，可安全并行。
  if (saveCandidates.length) {
    const saveTimeout = Math.min(SAVE_TIMEOUT_MS, pollDeadline - Date.now());
    console.error(`[poll-debug] SAVE-ENTER candidates=${saveCandidates.length} max=${MAX_SAVE_PER_POLL} timeout=${saveTimeout}`);
    // Fisher-Yates 打散
    for (let i = saveCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [saveCandidates[i], saveCandidates[j]] = [saveCandidates[j], saveCandidates[i]];
    }
    const toSave = saveCandidates.slice(0, MAX_SAVE_PER_POLL);
    const deferred = saveCandidates.slice(MAX_SAVE_PER_POLL);
    for (const c of deferred) {
      jobUpdates.push({ task_id: c.job.task_id, status: "polling", error: null, pollCount: c.pollCount });
    }
    const remainingBudget = pollDeadline - Date.now();
    if (remainingBudget < 10000) {
      // 剩余预算不足以完成任何保存：全部留到下次轮询
      console.error("[poll-debug] SAVE-SKIP budget<10s");
      for (const c of toSave) {
        jobUpdates.push({ task_id: c.job.task_id, status: "polling", error: null, pollCount: c.pollCount });
      }
    } else {
      const saveResults = await Promise.allSettled(
        toSave.map((c) =>
          withTimeout(saveCompletedApiJob(orderSnapshot, c.job, c.imageUrl, c.status, pendingAssets), saveTimeout, `图 ${c.job.image_number} 保存`)
        )
      );
      saveResults.forEach((res, i) => {
        const c = toSave[i];
        if (res.status === "fulfilled") {
          const saved = res.value;
          if (saved && saved.asset) {
            pendingAssets.push(saved.asset);
            notes.push(...saved.notes);
            jobUpdates.push({ task_id: c.job.task_id, status: "completed", error: null, pollCount: c.pollCount, resultImageUrl: c.imageUrl });
            console.error(`[poll-debug] SAVE-OK img=${c.job.image_number}`);
          } else if (saved && !saved.asset) {
            // 幂等跳过（已有同编号资产）
            notes.push(...saved.notes);
            jobUpdates.push({ task_id: c.job.task_id, status: "completed", error: null, pollCount: c.pollCount, resultImageUrl: c.imageUrl });
            console.error(`[poll-debug] SAVE-SKIP-IDEM img=${c.job.image_number}`);
          } else {
            jobUpdates.push({ task_id: c.job.task_id, status: "polling", error: null, pollCount: c.pollCount });
          }
        } else {
          // 保存超时/失败 ≠ 生成失败：图片在 APIMart 已生成好，下次轮询幂等续传。
          // 不写备注（避免刷屏），错误仅记录在 job 上。
          jobUpdates.push({ task_id: c.job.task_id, status: "polling", error: errorSummary(res.reason), pollCount: c.pollCount });
          console.error(`[poll-debug] SAVE-FAIL img=${c.job.image_number} reason=${String(errorSummary(res.reason)).slice(0, 140)}`);
        }
      });
    }
  } else {
    console.error("[poll-debug] NO-SAVE-CANDIDATES 0 completed on APIMart this round");
  }

  // 单次批量写回：新增资产 + 任务状态变更 + 备注 + 订单状态收尾，
  // 全部合并为【一次】orders.json 读写（跨境 COS 下每次读写 2~5s，必须收敛）。
  const updated = await updateLocalOrder(orderId, (current) => {
    let next: LocalOrder = { ...current };
    if (pendingAssets.length) {
      next = {
        ...next,
        order_assets: [
          ...next.order_assets,
          ...pendingAssets.map((a) => ({ ...a, id: randomUUID(), order_id: orderId, created_at: new Date().toISOString() }))
        ]
      };
      next.order_assets.sort((a, b) => a.sort_order - b.sort_order);
    }
    if (jobUpdates.length) {
      next = {
        ...next,
        generation_jobs: (next.generation_jobs ?? []).map((item) => {
          const upd = jobUpdates.find((u) => u.task_id === item.task_id);
          return upd
            ? { ...item, status: upd.status, poll_count: upd.pollCount, error: upd.error, result_image_url: upd.resultImageUrl ?? item.result_image_url, updated_at: new Date().toISOString() }
            : item;
        })
      };
    }
    const allNotes = [...notes];
    // 状态收尾：基于写回后的最新 jobs 计算，并入同一次写，不再额外读写
    const jobsNow = next.generation_jobs ?? [];
    const apiJobs = jobsNow.filter((j) => j.provider === "apimart");
    const completedCount = apiJobs.filter((j) => j.status === "completed").length;
    const failedCount = apiJobs.filter((j) => j.status === "failed").length;
    const pendingCount = apiJobs.filter((j) => j.status !== "completed" && j.status !== "failed").length;
    if (next.status === "generating" && apiJobs.length > 0 && pendingCount === 0) {
      if (completedCount > 0) {
        next.status = "pending_selection";
        allNotes.push(`订单已完成生成，进入选片。完成 ${completedCount} 张${failedCount > 0 ? `，失败 ${failedCount} 张` : ""}。`);
      } else if (failedCount > 0) {
        next.status = "generation_failed";
        allNotes.push("所有 APIMart 任务已结束且全部失败，订单标记为生成失败。");
      }
    }
    if (allNotes.length) {
      next = { ...next, admin_note: appendApiProgressNoteText(next.admin_note, allNotes) };
    }
    return next;
  });
  return updated ?? getLocalOrder(orderId);
}

export async function generateOrderPreviews(orderId: string, options: { source?: "user" | "admin" } = {}) {
  const order = await getLocalOrder(orderId);
  if (!order) throw new Error("Order not found");
  try {
    if (appConfig.generationMode === "manual") return await prepareGenerationPlan(order);
    if (appConfig.generationMode === "api" && options.source !== "admin") return await prepareGenerationPlan(order);
    if (appConfig.generationMode === "api") return await apiGenerate(order);
    return await mockGenerate(order);
  } catch (error) {
    if (appConfig.generationMode !== "manual") {
      const message = error instanceof Error ? error.message : "Generation failed";
      await updateLocalOrderStatus(orderId, appConfig.generationMode === "api" ? "generation_failed" : "failed", { admin_note: message });
    }
    throw error;
  }
}

export async function uploadManualGeneratedResults(orderId: string, files: File[]) {
  const order = await getLocalOrder(orderId);
  if (!order) throw new Error("Order not found");
  const existingCount = order.order_assets.filter((asset) => asset.kind === "generated").length;
  const plan = getOrderGenerationPlan(order);

  for (let index = 0; index < files.length; index += 1) {
    const imageNumber = existingCount + index + 1;
    const planItem = plan[imageNumber - 1];
    const generated = await saveGeneratedUpload(files[index], orderId, imageNumber - 1);
    const generatedBuffer = await readStoredFile(generated.relativePath);
    const preview = await savePreviewImageBuffer(await createWatermarkedPreviewBuffer(generatedBuffer), orderId, imageNumber);
    const metadata = await imageMetadataFromBuffer(generatedBuffer);
    await addLocalAsset(orderId, {
      kind: "generated",
      original_path: generated.relativePath,
      preview_path: preview.relativePath,
      mime_type: generated.mimeType,
      width: metadata.width,
      height: metadata.height,
      generation_prompt: planItem?.rawPrompt ?? null,
      theme_id: planItem?.themeId ?? null,
      theme_name: planItem?.themeName ?? null,
      prompt_id: planItem?.promptId ?? null,
      prompt_name: planItem?.promptName ?? null,
      aspect_ratio: planItem?.aspectRatio ?? null,
      is_cover_prompt: planItem?.isCoverPrompt ?? false,
      generation_type: planItem?.generationType ?? "manual_extra",
      prompt_index: planItem ? imageNumber - 1 : null,
      sort_order: imageNumber,
      is_selected: false,
      is_unlocked: false
    });
  }

  const updated = await getLocalOrder(orderId);
  const uploadedCount = updated?.order_assets.filter((asset) => asset.kind === "generated").length ?? existingCount + files.length;
  return {
    order: updated,
    uploadedCount,
    planCount: plan.length,
    message: uploadedCount < plan.length ? `当前只上传了 ${uploadedCount} 张，计划为 ${plan.length} 张。` : null
  };
}

export async function completeManualGeneration(orderId: string) {
  const order = await getLocalOrder(orderId);
  if (!order) throw new Error("Order not found");
  const generatedCount = order.order_assets.filter((asset) => asset.kind === "generated").length;
  if (generatedCount < 1) throw new Error("请先上传至少 1 张生成结果。");
  return updateLocalOrderStatus(orderId, "pending_selection");
}

// ===== ID Photo Generation =====

const ID_PHOTO_PROMPTS: Record<string, string> = {
  bride: "Identification card photo, premium clean passport portrait converted from the reference lifestyle photo, a 25-year-old Chinese woman with an elegant front view, centered composition, eyes looking straight into the lens, natural professional expression. Faithfully preserving the original facial layout, eyes, and hairstyle from the source image. Upgraded clothing: wearing a minimalist, crisp, professionally ironed light blue shirt. Bright and soft clamshell studio lighting, creating flawless but realistic skin details without over-softening, capturing authentic pores and skin texture. Clean solid white background, high contrast, perfect symmetry, 8k resolution",
  groom: "ID photo, professional passport portrait converted from the reference lifestyle photo, a 30-year-old Chinese man facing forward, looking directly at the camera, neutral expression, subtle and confident smile. Maintaining the core facial features and hair texture from the original image. Upgraded clothing: wearing a well-tailored dark charcoal grey suit with a crisp, neatly ironed white shirt. High-end studio lighting, softbox illumination, subtle shadows defining the jawline and masculine facial structure. Premium quality, real skin texture, visible pores, sharp focus on eyes, 8k resolution"
};

export type IdPhotoTaskState = {
  bride?: { taskId: string; status: "pending" | "completed" | "failed"; error?: string; assetId?: string };
  groom?: { taskId: string; status: "pending" | "completed" | "failed"; error?: string; assetId?: string };
};

export async function generateIdPhotoTasks(orderId: string) {
  const order = await getLocalOrder(orderId);
  if (!order) throw new Error("Order not found");
  if (order.photo_type !== "casual_photo") return null;

  const uploads = order.order_assets.filter((asset) => asset.kind === "upload");
  const brideAsset = uploads.find((a) => a.person_role === "bride");
  const groomAsset = uploads.find((a) => a.person_role === "groom");
  if (!brideAsset || !groomAsset) throw new Error("缺少新娘或新郎上传照片");

  const brideBuffer = await readStoredFile(brideAsset.original_path);
  const groomBuffer = await readStoredFile(groomAsset.original_path);

  const brideImageUrl = await apimartUploadImage({ buffer: brideBuffer, mimeType: brideAsset.mime_type, filename: path.basename(brideAsset.original_path) });
  const groomImageUrl = await apimartUploadImage({ buffer: groomBuffer, mimeType: groomAsset.mime_type, filename: path.basename(groomAsset.original_path) });

  const brideTask = await apimartCreateGenerationTask({
    prompt: ID_PHOTO_PROMPTS.bride,
    uploadedImageUrls: [brideImageUrl],
    aspectRatio: "3:4"
  });
  const groomTask = await apimartCreateGenerationTask({
    prompt: ID_PHOTO_PROMPTS.groom,
    uploadedImageUrls: [groomImageUrl],
    aspectRatio: "3:4"
  });

  const state: IdPhotoTaskState = {
    bride: { taskId: brideTask.taskId, status: "pending" },
    groom: { taskId: groomTask.taskId, status: "pending" }
  };

  await updateLocalOrder(orderId, (current) => ({
    ...current,
    metadata: { ...(current.metadata ?? {}), id_photo_tasks: state }
  }));

  return state;
}

export async function pollIdPhotoTasks(orderId: string) {
  const order = await getLocalOrder(orderId);
  if (!order) throw new Error("Order not found");
  const tasks = order.metadata?.id_photo_tasks as IdPhotoTaskState | undefined;
  if (!tasks) return null;

  const results: IdPhotoTaskState = {};

  for (const role of ["bride", "groom"] as const) {
    const task = tasks[role];
    if (!task || task.status === "completed" || task.status === "failed") {
      results[role] = task;
      continue;
    }

    try {
      const status = await apimartGetTaskStatus(task.taskId);
      if (["completed", "complete", "success", "succeeded", "done"].includes(status.status)) {
        if (!status.imageUrl) {
          results[role] = { ...task, status: "failed", error: "APIMart 任务已完成，但没有返回结果图片 URL" };
          continue;
        }
        // Download and save
        const downloaded = await apimartDownloadImage(status.imageUrl);
        const generated = await saveGeneratedImageBuffer(downloaded.buffer, orderId, role === "bride" ? 900 : 901, downloaded.mimeType, `idphoto-${role}`);
        const preview = await savePreviewImageBuffer(await createWatermarkedPreviewBuffer(downloaded.buffer), orderId, role === "bride" ? 900 : 901, `idphoto-${role}`);
        const metadata = await imageMetadataFromBuffer(downloaded.buffer);
        const asset = await addLocalAsset(orderId, {
          kind: "generated",
          person_role: role,
          original_path: generated.relativePath,
          preview_path: preview.relativePath,
          mime_type: generated.mimeType,
          width: metadata.width,
          height: metadata.height,
          generation_prompt: ID_PHOTO_PROMPTS[role],
          theme_id: null,
          theme_name: "证件照",
          prompt_id: null,
          prompt_name: `${role === "bride" ? "新娘" : "新郎"}证件照`,
          aspect_ratio: "3:4",
          is_cover_prompt: false,
          generation_type: "id_photo",
          generation_provider: "apimart",
          generation_model: appConfig.apimartModel,
          generation_task_id: task.taskId,
          generation_status: status.status,
          generation_error: null,
          prompt_index: null,
          sort_order: role === "bride" ? 900 : 901,
          is_selected: false,
          is_unlocked: true
        });
        const savedAsset = asset?.order_assets.find((a) => a.generation_task_id === task.taskId);
        results[role] = { ...task, status: "completed", assetId: savedAsset?.id };
      } else if (["failed", "failure", "cancelled", "canceled", "error"].includes(status.status)) {
        results[role] = { ...task, status: "failed", error: `APIMart 返回失败状态：${status.status}` };
      } else {
        results[role] = { ...task, status: "pending" };
      }
    } catch (err) {
      results[role] = { ...task, status: "failed", error: errorSummary(err) };
    }
  }

  // Update order with results
  await updateLocalOrder(orderId, (current) => {
    const nextMetadata = { ...(current.metadata ?? {}), id_photo_tasks: results };
    const idPhotoAssets: LocalOrder["id_photo_assets"] = { ...current.id_photo_assets };
    for (const role of ["bride", "groom"] as const) {
      const r = results[role];
      if (r?.status === "completed" && r.assetId) {
        const asset = current.order_assets.find((a) => a.id === r.assetId);
        if (asset) idPhotoAssets[role] = asset;
      }
    }
    return { ...current, metadata: nextMetadata, id_photo_assets: idPhotoAssets };
  });

  return results;
}

/** Re-generate watermark previews for all generated assets in an order (uses current watermark settings) */
export async function regenerateOrderWatermarks(orderId: string, options?: import("@/services/watermark").WatermarkOptions): Promise<{ updated: number; total: number; errors: string[] }> {
  const order = await getLocalOrder(orderId);
  if (!order) throw new Error("Order not found");
  const assets = order.order_assets.filter((a) => a.kind === "generated" && a.original_path && a.preview_path);
  if (assets.length === 0) return { updated: 0, total: 0, errors: [] };
  let updated = 0;
  const errors: string[] = [];
  for (const asset of assets) {
    try {
      const originalBuffer = await readStoredFile(asset.original_path!);
      const newPreviewBuffer = await createWatermarkedPreviewBuffer(originalBuffer, options);
      await overwriteStoredBuffer(asset.preview_path!, newPreviewBuffer);
      updated += 1;
    } catch (err) {
      errors.push(`#${asset.sort_order}: ${errorSummary(err)}`);
    }
  }
  // Log to admin_note
  const optLabel = options ? ` (文案="${options.text ?? "默认"}", 透明度=${options.opacity ?? 0.4})` : "";
  await updateLocalOrder(orderId, (current) => {
    const notePrefix = current.admin_note ? current.admin_note + "\n" : "";
    return { ...current, admin_note: `${notePrefix}[${new Date().toISOString()}] 水印批量更新${optLabel}：${updated}/${assets.length} 张成功${errors.length ? `，失败：${errors.join("; ")}` : ""}` };
  });
  return { updated, total: assets.length, errors };
}
