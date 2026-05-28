import path from "node:path";
import { appConfig } from "@/lib/config";
import type { OrderAsset } from "@/lib/types";
import { addLocalAsset, clearLocalGeneratedAssets, getLocalOrder, updateLocalOrderStatus } from "@/services/localStore";
import type { LocalOrder } from "@/services/localStore";
import { generateWeddingImage } from "@/services/gemini";
import { buildPreviewGenerationPlan, getSelectedThemes } from "@/services/prompts";
import { readStoredFile, saveGeneratedImage, saveGeneratedImageBuffer, saveGeneratedUpload } from "@/services/storage";
import { createWatermarkedPreview, imageMetadata } from "@/services/watermark";
import { apimartCreateGenerationTask, apimartDownloadImage, apimartPollTask, apimartUploadImage } from "@/services/generation/providers/apimart";

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
  for (const item of getOrderGenerationPlan(order)) {
    lines.push(`【图 ${item.imageNumber}｜${generationTypeLabel(item.generationType)}｜${item.themeName}｜${item.promptName}】`);
    lines.push(item.rawPrompt);
    lines.push("");
  }
  return lines.join("\n");
}

export function buildOrderInfo(order: LocalOrder) {
  return {
    orderId: order.id,
    selectedThemes: getSelectedThemes(order.selected_theme_ids ?? []).map((theme) => ({
      themeId: theme.themeId,
      themeName: theme.themeName
    })),
    generationPlan: getOrderGenerationPlan(order),
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
    const previewRelativePath = path.posix.join("previews", order.id, `${String(index + 1).padStart(2, "0")}.jpg`);
    await createWatermarkedPreview(generated.absolutePath, previewRelativePath);
    const metadata = await imageMetadata(generated.absolutePath);
    await addLocalAsset(order.id, {
      kind: "generated",
      original_path: generated.relativePath,
      preview_path: previewRelativePath,
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

function apiProgressNote(lines: string[]) {
  return [`API 生成记录`, `模式：${appConfig.generationMode}`, `Provider：${appConfig.generationProvider ?? "未配置"}`, `模型：${appConfig.apimartModel}`, ...lines].join("\n");
}

export async function apiGenerate(order: LocalOrder) {
  if (appConfig.generationProvider !== "apimart") throw new Error("GENERATION_PROVIDER 未配置为 apimart。");
  if (!appConfig.apimartApiKey) throw new Error("APIMART_API_KEY 未配置，无法调用 APIMart 生成。");
  const references = getReferenceUploadAssets(order);
  const { bride, groom } = references;
  if (!bride || !groom) throw new Error("缺少新娘或新郎正脸照，无法生成。");
  if (!order.selected_theme_ids?.length) throw new Error("当前订单未选择风格，请先选择风格后再生成。");

  await updateLocalOrderStatus(order.id, "generating", { admin_note: apiProgressNote(["准备调用 APIMart。"]) });
  await clearLocalGeneratedAssets(order.id);

  const brideReference = await readStoredFile(bride.original_path);
  const groomReference = await readStoredFile(groom.original_path);
  const plan = applyGenerationTestLimit(getOrderGenerationPlan(order));
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
      `本次生成数量：${plan.length}`
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
    await updateLocalOrderStatus(order.id, "generating", {
      admin_note: apiProgressNote([
        `新娘正脸照已传到 APIMart：${brideImageUrl}`,
        `新郎正脸照已传到 APIMart：${groomImageUrl}`,
        `图 ${item.imageNumber} task_id：${task.taskId}`,
        "任务轮询中。"
      ])
    });
    const taskResult = await apimartPollTask(task.taskId);
    const downloaded = await apimartDownloadImage(taskResult.imageUrl);
    const generated = await saveGeneratedImageBuffer(downloaded.buffer, order.id, index, downloaded.mimeType);
    const previewRelativePath = path.posix.join("previews", order.id, `${String(index + 1).padStart(2, "0")}.jpg`);
    await createWatermarkedPreview(generated.absolutePath, previewRelativePath);
    const metadata = await imageMetadata(generated.absolutePath);
    await addLocalAsset(order.id, {
      kind: "generated",
      original_path: generated.relativePath,
      preview_path: previewRelativePath,
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
      generation_provider: "apimart",
      generation_model: appConfig.apimartModel,
      generation_task_id: taskResult.taskId,
      generation_status: taskResult.status,
      generation_error: null,
      prompt_index: index,
      sort_order: item.imageNumber,
      is_selected: false,
      is_unlocked: false
    });
    await updateLocalOrderStatus(order.id, "generating", {
      admin_note: apiProgressNote([
        `新娘正脸照已传到 APIMart：${brideImageUrl}`,
        `新郎正脸照已传到 APIMart：${groomImageUrl}`,
        `图 ${item.imageNumber} task_id：${taskResult.taskId}`,
        "生成图已保存并生成水印预览。"
      ])
    });
  }

  return updateLocalOrderStatus(order.id, "ready_for_selection", { admin_note: apiProgressNote([`完成 API 生成：${plan.length} 张。`]) }) as Promise<LocalOrder | null>;
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
    const previewRelativePath = path.posix.join("previews", orderId, `${String(imageNumber).padStart(2, "0")}.jpg`);
    await createWatermarkedPreview(generated.absolutePath, previewRelativePath);
    const metadata = await imageMetadata(generated.absolutePath);
    await addLocalAsset(orderId, {
      kind: "generated",
      original_path: generated.relativePath,
      preview_path: previewRelativePath,
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
