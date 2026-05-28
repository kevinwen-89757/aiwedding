import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const bridePhoto = formData.get("bridePhoto");
    const groomPhoto = formData.get("groomPhoto");
    if (!(bridePhoto instanceof File) || bridePhoto.size === 0) {
      if (!(groomPhoto instanceof File) || groomPhoto.size === 0) return NextResponse.json({ error: "请分别上传新娘和新郎正脸照" }, { status: 400 });
      return NextResponse.json({ error: "请上传新娘正脸照" }, { status: 400 });
    }
    if (!(groomPhoto instanceof File) || groomPhoto.size === 0) return NextResponse.json({ error: "请上传新郎正脸照" }, { status: 400 });
    const order = await createLocalOrder({ customerName: formData.get("customerName"), customerPhone: formData.get("customerPhone"), customerEmail: formData.get("customerEmail") });
    const bride = await savePersonUpload(order.id, bridePhoto, "bride", 0);
    const groom = await savePersonUpload(order.id, groomPhoto, "groom", 1);
    await updateLocalUploadedPhotos(order.id, { bride, groom });
    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("POST /api/orders failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
