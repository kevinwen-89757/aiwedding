import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { findLocalAsset } from "@/services/localStore";
import { readStoredFile } from "@/services/storage";
type Context = { params: Promise<{ assetId: string }> };
export async function GET(request: Request, context: Context) {
  const { assetId } = await context.params;
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const asset = await findLocalAsset(assetId);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  if (asset.kind === "upload") {
    const unauthorized = adminUnauthorized(request);
    if (unauthorized) return unauthorized;
  }
  const pathToRead = preview ? asset.preview_path : asset.original_path;
  if (!pathToRead) return NextResponse.json({ error: "File not found" }, { status: 404 });
  if (!preview && asset.kind === "generated" && !asset.is_unlocked) return NextResponse.json({ error: "Asset is locked" }, { status: 403 });
  const file = await readStoredFile(pathToRead);
  return new NextResponse(new Uint8Array(file), { headers: { "content-type": preview ? "image/jpeg" : asset.mime_type, "cache-control": "private, max-age=60" } });
}
