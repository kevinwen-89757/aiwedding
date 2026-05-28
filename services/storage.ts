import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { appConfig } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
type StoredFile = { relativePath: string; absolutePath: string | null; mimeType: string };

export function isSupabaseStorage() {
  return appConfig.storageDriver === "supabase";
}

export function absoluteStoragePath(relativePath: string) {
  return path.resolve(process.cwd(), appConfig.localStorageRoot, relativePath);
}

async function uploadSupabaseObject(relativePath: string, buffer: Buffer, mimeType: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(appConfig.supabaseStorageBucket).upload(relativePath, buffer, {
    contentType: mimeType,
    upsert: true
  });
  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);
}

export async function saveUpload(file: File, orderId: string, role?: "bride" | "groom"): Promise<StoredFile> {
  if (!allowedMimeTypes.has(file.type)) throw new Error("Only JPEG, PNG, and WEBP images are supported.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be smaller than 10MB.");
  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const relativePath = isSupabaseStorage()
    ? `orders/${orderId}/uploads/${role ?? randomUUID()}${ext}`
    : `uploads/${orderId}/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  if (isSupabaseStorage()) {
    await uploadSupabaseObject(relativePath, buffer, file.type);
    return { relativePath, absolutePath: null, mimeType: file.type };
  }
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return { relativePath, absolutePath, mimeType: file.type };
}

export async function saveGeneratedImage(buffer: Buffer, orderId: string, index: number): Promise<StoredFile> {
  const relativePath = isSupabaseStorage()
    ? `orders/${orderId}/generated/original/${String(index + 1).padStart(2, "0")}.png`
    : `generated/${orderId}/${String(index + 1).padStart(2, "0")}.png`;
  if (isSupabaseStorage()) {
    await uploadSupabaseObject(relativePath, buffer, "image/png");
    return { relativePath, absolutePath: null, mimeType: "image/png" };
  }
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return { relativePath, absolutePath, mimeType: "image/png" };
}

export async function saveGeneratedImageBuffer(buffer: Buffer, orderId: string, index: number, mimeType = "image/png"): Promise<StoredFile> {
  const ext = mimeType === "image/jpeg" ? ".jpg" : mimeType === "image/webp" ? ".webp" : ".png";
  const relativePath = isSupabaseStorage()
    ? `orders/${orderId}/generated/original/${String(index + 1).padStart(2, "0")}${ext}`
    : `generated/${orderId}/${String(index + 1).padStart(2, "0")}${ext}`;
  if (isSupabaseStorage()) {
    await uploadSupabaseObject(relativePath, buffer, mimeType);
    return { relativePath, absolutePath: null, mimeType };
  }
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return { relativePath, absolutePath, mimeType };
}

export async function saveGeneratedUpload(file: File, orderId: string, index: number): Promise<StoredFile> {
  if (!allowedMimeTypes.has(file.type)) throw new Error("Only JPEG, PNG, and WEBP images are supported.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Generated image must be smaller than 20MB.");
  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const relativePath = isSupabaseStorage()
    ? `orders/${orderId}/generated/original/${String(index + 1).padStart(2, "0")}${ext}`
    : `generated/${orderId}/${String(index + 1).padStart(2, "0")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  if (isSupabaseStorage()) {
    await uploadSupabaseObject(relativePath, buffer, file.type);
    return { relativePath, absolutePath: null, mimeType: file.type };
  }
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return { relativePath, absolutePath, mimeType: file.type };
}

export async function savePreviewImageBuffer(buffer: Buffer, orderId: string, imageNumber: number) {
  const relativePath = isSupabaseStorage()
    ? `orders/${orderId}/generated/preview/${String(imageNumber).padStart(2, "0")}.jpg`
    : `previews/${orderId}/${String(imageNumber).padStart(2, "0")}.jpg`;
  if (isSupabaseStorage()) {
    await uploadSupabaseObject(relativePath, buffer, "image/jpeg");
    return { relativePath, absolutePath: null, mimeType: "image/jpeg" };
  }
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return { relativePath, absolutePath, mimeType: "image/jpeg" };
}

export async function readStoredFile(relativePath: string) {
  if (isSupabaseStorage()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(appConfig.supabaseStorageBucket).download(relativePath);
    if (error) throw new Error(`Supabase Storage download failed: ${error.message}`);
    return Buffer.from(await data.arrayBuffer());
  }
  return readFile(absoluteStoragePath(relativePath));
}
