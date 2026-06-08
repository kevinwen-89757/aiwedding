import { NextResponse } from "next/server";
import { addLocalAsset, getLocalOrder, updateLocalUploadedPhotos } from "@/services/localStore";
import type { UploadedPersonPhoto } from "@/lib/types";

/**
 * POST /api/orders/:id/confirm-upload
 * 浏览器直传 COS 完成后，通知服务端补写 asset 记录。
 * Body: { brideKey, brideMime, brideWidth, brideHeight, brideSize, groomKey, groomMime, groomWidth, groomHeight, groomSize }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await getLocalOrder(id);
    if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

    const {
      brideKey, brideMime = "image/jpeg", brideWidth, brideHeight, brideSize,
      groomKey, groomMime = "image/jpeg", groomWidth, groomHeight, groomSize,
    } = await request.json() as {
      brideKey?: string | null; brideMime?: string; brideWidth?: number; brideHeight?: number; brideSize?: number;
      groomKey?: string | null; groomMime?: string; groomWidth?: number; groomHeight?: number; groomSize?: number;
    };

    const photos: { bride?: UploadedPersonPhoto; groom?: UploadedPersonPhoto } = {};

    if (brideKey) {
      const asset = await addLocalAsset(id, {
        kind: "upload",
        person_role: "bride",
        original_path: brideKey,
        preview_path: null,
        mime_type: brideMime,
        width: brideWidth ?? 0,
        height: brideHeight ?? 0,
        generation_prompt: null,
        theme_id: null,
        theme_name: null,
        prompt_id: null,
        prompt_name: null,
        aspect_ratio: null,
        is_cover_prompt: false,
        generation_type: null,
        generation_provider: null,
        generation_model: null,
        generation_task_id: null,
        generation_status: null,
        generation_error: null,
        prompt_index: null,
        sort_order: 0,
        is_selected: false,
        is_unlocked: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = Array.isArray(asset) ? asset.find((a: any) => a.person_role === "bride") : asset;
      photos.bride = {
        originalName: brideKey.split("/").pop() ?? "bride.jpg",
        path: brideKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
        url: created ? `/api/download/${(created as any).id}` : brideKey,
        mimeType: brideMime,
        size: brideSize ?? 0,
      };
    }

    if (groomKey) {
      const asset = await addLocalAsset(id, {
        kind: "upload",
        person_role: "groom",
        original_path: groomKey,
        preview_path: null,
        mime_type: groomMime,
        width: groomWidth ?? 0,
        height: groomHeight ?? 0,
        generation_prompt: null,
        theme_id: null,
        theme_name: null,
        prompt_id: null,
        prompt_name: null,
        aspect_ratio: null,
        is_cover_prompt: false,
        generation_type: null,
        generation_provider: null,
        generation_model: null,
        generation_task_id: null,
        generation_status: null,
        generation_error: null,
        prompt_index: null,
        sort_order: 1,
        is_selected: false,
        is_unlocked: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = Array.isArray(asset) ? asset.find((a: any) => a.person_role === "groom") : asset;
      photos.groom = {
        originalName: groomKey.split("/").pop() ?? "groom.jpg",
        path: groomKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
        url: created ? `/api/download/${(created as any).id}` : groomKey,
        mimeType: groomMime,
        size: groomSize ?? 0,
      };
    }

    await updateLocalUploadedPhotos(id, { bride: photos.bride, groom: photos.groom });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[confirm-upload] 失败:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "确认上传失败" }, { status: 500 });
  }
}
