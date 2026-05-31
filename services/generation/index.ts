import path from "node:path";
import { appConfig } from "@/lib/config";
import type { GenerationJob, OrderAsset } from "@/lib/types";
import { addLocalAsset, clearLocalGeneratedAssets, getLocalOrder, updateLocalOrder, updateLocalOrderStatus } from "@/services/localStore";
import type { LocalOrder } from "@/services/localStore";
import { generateWeddingImage } from "@/services/gemini";
import { buildPreviewGenerationPlan, getSelectedThemes } from "@/services/prompts";
import { readStoredFile, saveGeneratedImage, saveGeneratedImageBuffer, saveGeneratedUpload, savePreviewImageBuffer } from "@/services/storage";
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

export function getReferenceUploadAssets(order: Pick<LocalOrder, "order_assets">) {
  const uploads = order.order_assets.filter((asset) => asset.kind === "upload");
  const bride = uploads.find((asset) => asset.person_role === "bride") ?? uploads[0] ?? null;
  const groom = uploads.find((asset) => asset.person_role === "groom") ?? uploads.find((asset) => asset.id !== bride?.id) ?? null;
  // Future API providers should send both bride and groom reference images with rawPrompt unchanged.
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
  return {
    generationTestLimit: Number.isFinite(appConfig.generationTestLimit) ? appConfig.generationTestLimit : null,
    apimartResolution: appConfig.apimartResolution,
    apimartTimeoutMs: Number.isFinite(appConfig.apimartTimeoutMs) ? appConfig.apimartTimeoutMs : 300000,
    plannedTaskCount: getEffectiveOrderGenerationPlan(order).length
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

function recoverLegacyApiJobs(order: LocalOrder) {
  const matches = Array.from((order.admin_note ?? "").matchAll(/图\s*(\d+)\s*task_id[：:]\s*([^\s]+)/g));
  if (!matches.length) return [];
  const plan = getOrderGenerationPlan(order);
  const now = new Date().toISOString();
  return matches.map((match) => {
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
  const plan = getEffectiveOrderGenerationPlan(order);
  if (!plan.length) throw new Error("没有可执行的生成计划。");

  const brideImageUrl = await apimartUploadImage({
    buffer: brideReference,
    mimeType: bride.mime_type,
    filename: path.basename(bride.original_path)
  });
  await updateLocalOrderStatus(order.id, "generating", { admin_note: apiProgressNote([`新娘正脸照已传到 APIMart：${brideImageUrl}`, "准备上传新郎正脸照。"]) });

  const groomImageUrl = await apimartUploadImage({
    buffer: groomReference,
    mimeType: groom.mime_type,
    filename: path.basename(groom.original_path)
  });
  await updateLocalOrderStatus(order.id, "generating", {
    admin_note: apiProgressNote([
      `新娘正脸照已传到 APIMart：${brideImageUrl}`,
      `新郎正脸照已传到 APIMart：${groomImageUrl}`,
      `本次生成数量：${plan.length}`,
      `本次 resolution=${appConfig.apimartResolution}`,
      `本次 timeoutMs=${Number.isFinite(appConfig.apimartTimeoutMs) ? appConfig.apimartTimeoutMs : 300000}`
    ])
  });

  for (let index = 0; index < plan.length; index += 1) {
    const item = plan[index];
    const task = await apimartCreateGenerationTask({
      prompt: item.rawPrompt,
      uploadedImageUrls: [brideImageUrl, groomImageUrl],
      aspectRatio: item.aspectRatio
    });
    console.log("[apimart] task created", {
      orderId: order.id,
      taskId: task.taskId,
      index,
      themeName: item.themeName,
      aspectRatio: item.aspectRatio
    });
    const now = new Date().toISOString();
    const job: GenerationJob = {
      provider: "apimart",
      task_id: task.taskId,
      image_number: item.imageNumber,
      status: "created",
      poll_count: 0,
      result_image_url: null,
      error: null,
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
    await updateLocalOrder(order.id, (current) => ({
      ...current,
      status: "generating",
      generation_jobs: [...(current.generation_jobs ?? []), job],
      admin_note: appendApiProgressNoteText(current.admin_note, [
        `已创建 APIMart 任务 task_id：${task.taskId}`,
        `图 ${item.imageNumber} 已进入 APIMart 队列，等待后续查询。`
      ])
    }));
  }

  await appendApiProgress(order.id, ["任务已全部创建。请点击“查询生成结果”，或刷新后台继续查询。"]);
  return getLocalOrder(order.id);
}

async function saveCompletedApiJob(order: LocalOrder, job: GenerationJob, imageUrl: string, status: string) {
  if (hasAssetForTask(order, job.task_id)) return;
  await appendApiProgress(order.id, [`APIMart 返回图片 URL：${imageUrl}`, `图 ${job.image_number} 正在下载生成图。`]);
  const downloaded = await apimartDownloadImage(imageUrl);
  const generated = await saveGeneratedImageBuffer(downloaded.buffer, order.id, job.image_number - 1, downloaded.mimeType);
  await appendApiProgress(order.id, [`图 ${job.image_number} 原图已保存到 Supabase Storage：${generated.relativePath}`]);
  const preview = await savePreviewImageBuffer(await createWatermarkedPreviewBuffer(downloaded.buffer), order.id, job.image_number);
  await appendApiProgress(order.id, [`图 ${job.image_number} 水印预览图已保存到 Supabase Storage：${preview.relativePath}`]);
  const metadata = await imageMetadataFromBuffer(downloaded.buffer);
  await addLocalAsset(order.id, {
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
  let jobs = order.generation_jobs ?? [];
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
    if (job.status === "completed" || job.status === "failed") continue;
    const pollCount = job.poll_count + 1;
    try {
      const result = await apimartGetTaskStatus(job.task_id);
      await appendApiProgress(orderId, [`图 ${job.image_number} 第 ${pollCount} 次查询：状态 ${result.status}`]);
      if (["completed", "complete", "success", "succeeded", "done"].includes(result.status)) {
        if (!result.imageUrl) throw new Error(`APIMart 任务 ${job.task_id} 已完成，但没有返回结果图片 URL。`);
        await saveCompletedApiJob(await getLocalOrder(orderId) as LocalOrder, job, result.imageUrl, result.status);
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
          status: "generation_failed",
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
      const message = error instanceof Error ? error.message : "APIMart 查询失败";
      await updateLocalOrder(orderId, (current) => ({
        ...current,
        status: "generation_failed",
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
  if (latestJobs.length && completedApiJobs(latest).length === latestJobs.length) {
    await updateLocalOrderStatus(orderId, "ready_for_selection", {
      admin_note: appendApiProgressNoteText(latest.admin_note, [`订单状态已更新为 ready_for_selection。完成 API 生成：${latestJobs.length} 张。`])
    });
  } else if (failedApiJobs(latest).length > 0 && pendingApiJobs(latest).length === 0) {
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
