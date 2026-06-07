import path from "node:path";
import { appConfig } from "@/lib/config";
import type { GenerationJob, OrderAsset } from "@/lib/types";
import { addLocalAsset, clearLocalGeneratedAssets, getLocalOrder, updateLocalOrder, updateLocalOrderStatus } from "@/services/localStore";
import type { LocalOrder } from "@/services/localStore";
import { generateWeddingImage } from "@/services/gemini";
import { buildPreviewGenerationPlan, getSelectedThemes } from "@/services/prompts";
import { readStoredFile, saveGeneratedImage, saveGeneratedImageBuffer, saveGeneratedUpload, savePreviewImageBuffer, overwriteStoredBuffer } from "@/services/storage";
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

export function getGenerationRuntimeConfig(order: Pick<LocalOrder, "selected_theme_ids">) {
  const planLength = getEffectiveOrderGenerationPlan(order).length;
  return {
    generationTestLimit: Number.isFinite(appConfig.generationTestLimit) ? appConfig.generationTestLimit : null,
    effectiveLimit: Number.isFinite(appConfig.generationTestLimit) ? appConfig.generationTestLimit : null,
    apimartResolution: appConfig.apimartResolution,
    apimartTimeoutMs: Number.isFinite(appConfig.apimartTimeoutMs) ? appConfig.apimartTimeoutMs : 300000,
    planLength,
    plannedTaskCount: planLength
  };
}

function apiProgressNote(lines: string[]) {
  return [`API 生成记录`, `模式：${appConfig.generationMode}`, `Provider：${appConfig.generationProvider ?? "未配置"}`, `模型：${appConfig.apimartModel}`, `resolution=${appConfig.apimartResolution}`, `timeoutMs=${Number.isFinite(appConfig.apimartTimeoutMs) ? appConfig.apimartTimeoutMs : 300000}`, `GENERATION_TEST_LIMIT=${Number.isFinite(appConfig.generationTestLimit) ? appConfig.generationTestLimit : "未设置"}`, ...lines].join("\n");
}

function appendApiProgressNoteText(current: string | null, lines: string[]) {
  const base = current?.startsWith("API 生成记录") ? current : apiProgressNote([]);
  const next = [base, ...lines].filter(Boolean).join("\n");
  return next.length > 10000 ? next.slice(next.length - 10000) : next;
}

async function appendApiProgress(orderId: string, lines: string[], status: LocalOrder["status"] = "generating") {
  return updateLocalOrder(orderId, (order) => ({
    ...order,
    status,
    admin_note: appendApiProgressNoteText(order.admin_note, lines)
  }));
}

function pendingApiJobs(order: LocalOrder) {
  return (order.generation_jobs ?? []).filter((job) => job.provider === "apimart" && job.status !== "completed" && job.status !== "failed");
}

function completedApiJobs(order: LocalOrder) {
  return (order.generation_jobs ?? []).filter((job) => job.provider === "apimart" && job.status === "completed");
}

function failedApiJobs(order: LocalOrder) {
  return (order.generation_jobs ?? []).filter((job) => job.provider === "apimart" && job.status === "failed");
}

function hasAssetForTask(order: LocalOrder, taskId: string) {
  return order.order_assets.some((asset) => asset.kind === "generated" && asset.generation_task_id === taskId);
}

function errorSummary(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "未知错误");
  return message.length > 500 ? `${message.slice(0, 500)}...` : message;
}

function buildGenerationJob(item: GenerationTaskItem, index: number, input: {
  taskId: string;
  status: GenerationJob["status"];
  error: string | null;
  resultImageUrl?: string | null;
}): GenerationJob {
  const now = new Date().toISOString();
  return {
    provider: "apimart",
    task_id: input.taskId,
    image_number: item.imageNumber,
    status: input.status,
    poll_count: 0,
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
    resolution: appConfig.apimartResolution,
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

  await updateLocalOrder(order.id, (current) => ({
    ...current,
    status: "generating",
    admin_note: apiProgressNote(["准备调用 APIMart。"]),
    generation_jobs: []
  }));
  await clearLocalGeneratedAssets(order.id);

  const brideReference = await readStoredFile(bride.original_path);
  const groomReference = await readStoredFile(groom.original_path);
  console.log("[start-generation] reference photos loaded", {
    brideSize: `${(brideReference.length / 1024).toFixed(0)}KB`,
    groomSize: `${(groomReference.length / 1024).toFixed(0)}KB`,
    brideMime: bride.mime_type,
    groomMime: groom.mime_type
  });
  const plan = getEffectiveOrderGenerationPlan(order);
  if (!plan.length) throw new Error("没有可执行的生成计划。");
  const runtimeConfig = getGenerationRuntimeConfig(order);
  console.log("[start-generation] plan diagnostics", {
    orderId: order.id,
    plannedTaskCount: runtimeConfig.plannedTaskCount,
    planLength: plan.length,
    effectiveLimit: runtimeConfig.effectiveLimit,
    resolution: runtimeConfig.apimartResolution,
    timeoutMs: runtimeConfig.apimartTimeoutMs
  });

  const brideImageUrl = await apimartUploadImage({
    buffer: brideReference,
    mimeType: bride.mime_type,
    filename: path.basename(bride.original_path)
  });
  await updateLocalOrderStatus(order.id, "generating", { admin_note: apiProgressNote([`新娘正脸照已传到 APIMart：${brideImageUrl}`, "准备上传新郎正脸照。"]) });

  console.log("[start-generation] 开始上传新郎照片...", { groomSize: `${(groomReference.length / 1024).toFixed(0)}KB` });
  const groomImageUrl = await apimartUploadImage({
    buffer: groomReference,
    mimeType: groom.mime_type,
    filename: path.basename(groom.original_path)
  });
  await updateLocalOrderStatus(order.id, "generating", {
    admin_note: apiProgressNote([
      `新娘正脸照已传到 APIMart：${brideImageUrl}`,
      `新郎正脸照已传到 APIMart：${groomImageUrl}`,
      `计划任务数：${runtimeConfig.plannedTaskCount}`,
      `plan.length=${plan.length}`,
      `effectiveLimit=${runtimeConfig.effectiveLimit ?? "未设置"}`,
      `本次 resolution=${appConfig.apimartResolution}`,
      `本次 timeoutMs=${Number.isFinite(appConfig.apimartTimeoutMs) ? appConfig.apimartTimeoutMs : 300000}`
    ])
  });

  const jobs: GenerationJob[] = [];
  for (let index = 0; index < plan.length; index += 1) {
    const item = plan[index];
    // Guard: 跳过空 prompt，防止 APIMart 返回 400
    if (!item.rawPrompt || item.rawPrompt.trim().length === 0) {
      const message = `图 ${item.imageNumber} prompt 为空，已跳过。请检查「${item.themeName}」风格的「${item.promptName}」prompt 是否已填写。`;
      console.error("[apimart] empty prompt skipped", { orderId: order.id, imageNumber: item.imageNumber, themeName: item.themeName, promptName: item.promptName });
      const job = buildGenerationJob(item, index, {
        taskId: `empty-prompt-${order.id}-${item.imageNumber}`,
        status: "failed",
        error: message
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
    await updateLocalOrder(order.id, (current) => ({
      ...current,
      status: "generating",
      generation_jobs: jobs,
      admin_note: appendApiProgressNoteText(current.admin_note, [
        `准备创建图 ${item.imageNumber} / ${plan.length}。`
      ])
    }));
    try {
      const task = await apimartCreateGenerationTask({
        prompt: item.rawPrompt,
        uploadedImageUrls: [brideImageUrl, groomImageUrl],
        aspectRatio: item.aspectRatio
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
        error: null
      });
      jobs.push(job);
      await updateLocalOrder(order.id, (current) => ({
        ...current,
        status: "generating",
        generation_jobs: jobs,
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
        error: message
      });
      jobs.push(job);
      await updateLocalOrder(order.id, (current) => ({
        ...current,
        status: "generating",
        generation_jobs: jobs,
        admin_note: appendApiProgressNoteText(current.admin_note, [
          `图 ${item.imageNumber} 创建任务失败：${message}`
        ])
      }));
    }
  }

  const createdCount = jobs.filter((job) => job.status !== "failed").length;
  const failedCount = jobs.length - createdCount;
  await updateLocalOrder(order.id, (current) => ({
    ...current,
    status: createdCount > 0 ? "generating" : "generation_failed",
    generation_jobs: jobs,
    admin_note: appendApiProgressNoteText(current.admin_note, [
      `任务创建循环结束：计划 ${plan.length} 个，成功 ${createdCount} 个，失败 ${failedCount} 个，generation_jobs.length=${jobs.length}。`,
      createdCount > 0 ? "请点击“查询生成结果”，或刷新后台继续查询。" : "所有 APIMart 任务创建失败，订单已标记 generation_failed。"
    ])
  }));
  return getLocalOrder(order.id);
}

async function saveCompletedApiJob(orderId: string, job: GenerationJob, imageUrl: string, status: string) {
  // 每次保存前重新读取订单，防止 stale snapshot 导致重复
  const freshOrder = await getLocalOrder(orderId);
  if (!freshOrder) return;
  if (hasAssetForTask(freshOrder, job.task_id)) return;
  // 同 image_number 已存在则跳过（防止多轮恢复导致同一编号重复保存）
  if (freshOrder.order_assets.some((a) => a.kind === "generated" && a.sort_order === job.image_number)) {
    await appendApiProgress(orderId, [`图 ${job.image_number} 已有同编号资产，跳过重复保存。`]);
    return;
  }
  // 用 task_id 前 8 位做文件名，避免同 image_number 的不同任务互相覆盖
  const taskSuffix = job.task_id.replace(/^create-failed-/, "").slice(0, 8);
  await appendApiProgress(orderId, [`APIMart 返回图片 URL：${imageUrl}`, `图 ${job.image_number} 正在下载生成图。`]);
  const downloaded = await apimartDownloadImage(imageUrl);
  const generated = await saveGeneratedImageBuffer(downloaded.buffer, orderId, job.image_number - 1, downloaded.mimeType, taskSuffix);
  await appendApiProgress(orderId, [`图 ${job.image_number} 原图已保存到 Supabase Storage：${generated.relativePath}`]);
  const preview = await savePreviewImageBuffer(await createWatermarkedPreviewBuffer(downloaded.buffer), orderId, job.image_number, taskSuffix);
  await appendApiProgress(orderId, [`图 ${job.image_number} 水印预览图已保存到 Supabase Storage：${preview.relativePath}`]);
  const metadata = await imageMetadataFromBuffer(downloaded.buffer);
  await addLocalAsset(orderId, {
    kind: "generated",
    original_path: generated.relativePath,
    preview_path: preview.relativePath,
    mime_type: generated.mimeType,
    width: metadata.width,
    height: metadata.height,
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
    generation_status: status,
    generation_error: null,
    prompt_index: job.prompt_index,
    sort_order: job.image_number,
    is_selected: false,
    is_unlocked: false
  });
}

export async function pollApiGeneration(orderId: string) {
  let order = await getLocalOrder(orderId);
  if (!order) throw new Error("Order not found");
  const plannedTaskCount = getEffectiveOrderGenerationPlan(order).length;
  const generatedAssetCount = order.order_assets.filter((asset) => asset.kind === "generated").length;
  let jobs = order.generation_jobs ?? [];
  await appendApiProgress(orderId, [
    `poll 诊断：generation_jobs.length=${jobs.length}`,
    `poll 诊断：generated_assets.length=${generatedAssetCount}`,
    `poll 诊断：plannedTaskCount=${plannedTaskCount}`,
    ...(jobs.length < plannedTaskCount ? ["警告：generation_jobs 数量少于计划任务数。"] : [])
  ]);
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
  if (!jobs.length) throw new Error("当前订单没有可查询的 APIMart task_id。");

  for (const job of jobs) {
    if (job.status === "completed") {
      await appendApiProgress(orderId, [`图 ${job.image_number} 已完成，跳过重复保存。`]);
      continue;
    }
    if (job.status === "failed") {
      await appendApiProgress(orderId, [`图 ${job.image_number} 已失败，跳过查询：${job.error ?? "未记录错误"}`]);
      continue;
    }
    const pollCount = job.poll_count + 1;
    try {
      const result = await apimartGetTaskStatus(job.task_id);
      await appendApiProgress(orderId, [`图 ${job.image_number} 第 ${pollCount} 次查询：状态 ${result.status}`]);
      if (["completed", "complete", "success", "succeeded", "done"].includes(result.status)) {
        if (!result.imageUrl) throw new Error(`APIMart 任务 ${job.task_id} 已完成，但没有返回结果图片 URL。`);
        await saveCompletedApiJob(orderId, job, result.imageUrl, result.status);
        await updateLocalOrder(orderId, (current) => ({
          ...current,
          status: "generating",
          generation_jobs: (current.generation_jobs ?? []).map((item) => item.task_id === job.task_id ? {
            ...item,
            status: "completed",
            poll_count: pollCount,
            result_image_url: result.imageUrl,
            error: null,
            updated_at: new Date().toISOString()
          } : item)
        }));
      } else if (["failed", "failure", "cancelled", "canceled", "error"].includes(result.status)) {
        await updateLocalOrder(orderId, (current) => ({
          ...current,
          status: "generating",
          generation_jobs: (current.generation_jobs ?? []).map((item) => item.task_id === job.task_id ? {
            ...item,
            status: "failed",
            poll_count: pollCount,
            error: `APIMart 返回失败状态：${result.status}`,
            updated_at: new Date().toISOString()
          } : item),
          admin_note: appendApiProgressNoteText(current.admin_note, [`图 ${job.image_number} 生成失败：APIMart 返回状态 ${result.status}`])
        }));
      } else {
        await updateLocalOrder(orderId, (current) => ({
          ...current,
          status: "generating",
          generation_jobs: (current.generation_jobs ?? []).map((item) => item.task_id === job.task_id ? {
            ...item,
            status: "polling",
            poll_count: pollCount,
            updated_at: new Date().toISOString()
          } : item)
        }));
      }
    } catch (error) {
      const message = errorSummary(error);
      await updateLocalOrder(orderId, (current) => ({
        ...current,
        status: "generating",
        generation_jobs: (current.generation_jobs ?? []).map((item) => item.task_id === job.task_id ? {
          ...item,
          status: "failed",
          poll_count: pollCount,
          error: message,
          updated_at: new Date().toISOString()
        } : item),
        admin_note: appendApiProgressNoteText(current.admin_note, [`图 ${job.image_number} 查询失败：${message}`])
      }));
    }
  }

  const latest = await getLocalOrder(orderId);
  if (!latest) throw new Error("Order not found");
  const latestJobs = latest.generation_jobs ?? [];
  const completedCount = completedApiJobs(latest).length;
  const failedCount = failedApiJobs(latest).length;
  const pendingCount = pendingApiJobs(latest).length;
  if (latestJobs.length && completedCount === latestJobs.length) {
    await updateLocalOrderStatus(orderId, "ready_for_selection", {
      admin_note: appendApiProgressNoteText(latest.admin_note, [`订单状态已更新为 ready_for_selection。完成 API 生成：${latestJobs.length} 张。`])
    });
  } else if (completedCount > 0 && pendingCount === 0) {
    await updateLocalOrderStatus(orderId, "ready_for_selection", {
      admin_note: appendApiProgressNoteText(latest.admin_note, [`订单状态已更新为 ready_for_selection。完成 ${completedCount} 张，失败 ${failedCount} 张。`])
    });
  } else if (failedCount > 0 && pendingCount === 0) {
    await updateLocalOrderStatus(orderId, "generation_failed", {
      admin_note: appendApiProgressNoteText(latest.admin_note, ["所有 APIMart 任务已结束，其中存在失败任务。"])
    });
  }
  return getLocalOrder(orderId);
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
