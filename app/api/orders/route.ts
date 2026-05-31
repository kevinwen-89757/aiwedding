import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { addLocalAsset, createLocalOrder, updateLocalUploadedPhotos } from "@/services/localStore";
import { readStoredFile, saveUpload } from "@/services/storage";
import { imageMetadataFromBuffer } from "@/services/watermark";
import type { UploadedPersonPhoto } from "@/lib/types";

async function savePersonUpload(orderId: string, file: File, role: "bride" | "groom", sortOrder: number) {
  const stored = await saveUpload(file, orderId, role);
  const metadata = await imageMetadataFromBuffer(await readStoredFile(stored.relativePath));
  const updated = await addLocalAsset(orderId, { kind: "upload", person_role: role, original_path: stored.relativePath, preview_path: null, mime_type: stored.mimeType, width: metadata.width, height: metadata.height, generation_prompt: null, theme_id: null, theme_name: null, prompt_id: null, prompt_name: null, aspect_ratio: null, is_cover_prompt: false, generation_type: null, generation_provider: null, generation_model: null, generation_task_id: null, generation_status: null, generation_error: null, prompt_index: null, sort_order: sortOrder, is_selected: false, is_unlocked: true });
  const asset = updated?.order_assets.find((item) => item.kind === "upload" && item.person_role === role && item.original_path === stored.relativePath);
  const photo: UploadedPersonPhoto = {
    originalName: file.name,
    path: stored.relativePath,
    url: asset ? `/api/download/${asset.id}` : stored.relativePath,
    mimeType: stored.mimeType,
    size: file.size
  };
  return photo;
}

function jsonError(error: string, detail: string, status = 500) {
  return NextResponse.json({ error, detail }, { status });
}

function uploadConfigDetail() {
  return [
    `STORAGE_DRIVER=${appConfig.storageDriver}`,
    `SUPABASE_URL configured: ${Boolean(appConfig.supabaseUrl)}`,
    `SERVICE_ROLE configured: ${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}`,
    `BUCKET configured: ${Boolean(appConfig.supabaseStorageBucket)}`
  ].join("; ");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const customerName = formData.get("customerName");
    if (typeof customerName !== "string" || !customerName.trim()) return jsonError("请填写姓名，方便后台识别订单", "customerName is required", 400);
    const bridePhoto = formData.get("bridePhoto");
    const groomPhoto = formData.get("groomPhoto");
    if (!(bridePhoto instanceof File) || bridePhoto.size === 0) {
      if (!(groomPhoto instanceof File) || groomPhoto.size === 0) return jsonError("请分别上传新娘和新郎正脸照", "bridePhoto and groomPhoto are required", 400);
      return jsonError("请上传新娘正脸照", "bridePhoto is required", 400);
    }
    if (!(groomPhoto instanceof File) || groomPhoto.size === 0) return jsonError("请上传新郎正脸照", "groomPhoto is required", 400);
    const order = await createLocalOrder({ customerName: formData.get("customerName"), customerPhone: formData.get("customerPhone"), customerEmail: formData.get("customerEmail") });
    const bride = await savePersonUpload(order.id, bridePhoto, "bride", 0);
    const groom = await savePersonUpload(order.id, groomPhoto, "groom", 1);
    await updateLocalUploadedPhotos(order.id, { bride, groom });
    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("POST /api/orders failed:", message);
    return jsonError(message || "创建订单失败，请稍后重试。", uploadConfigDetail(), 500);
  }
}
