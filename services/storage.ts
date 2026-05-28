import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { appConfig } from "@/lib/config";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function absoluteStoragePath(relativePath: string) {
  return path.resolve(process.cwd(), appConfig.localStorageRoot, relativePath);
}

export async function saveUpload(file: File, orderId: string) {
  if (!allowedMimeTypes.has(file.type)) throw new Error("Only JPEG, PNG, and WEBP images are supported.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be smaller than 10MB.");
  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const relativePath = `uploads/${orderId}/${randomUUID()}${ext}`;
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));
  return { relativePath, absolutePath, mimeType: file.type };
}

export async function saveGeneratedImage(buffer: Buffer, orderId: string, index: number) {
  const relativePath = `generated/${orderId}/${String(index + 1).padStart(2, "0")}.png`;
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return { relativePath, absolutePath, mimeType: "image/png" };
}

export async function saveGeneratedImageBuffer(buffer: Buffer, orderId: string, index: number, mimeType = "image/png") {
  const ext = mimeType === "image/jpeg" ? ".jpg" : mimeType === "image/webp" ? ".webp" : ".png";
  const relativePath = `generated/${orderId}/${String(index + 1).padStart(2, "0")}${ext}`;
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return { relativePath, absolutePath, mimeType };
}

export async function saveGeneratedUpload(file: File, orderId: string, index: number) {
  if (!allowedMimeTypes.has(file.type)) throw new Error("Only JPEG, PNG, and WEBP images are supported.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Generated image must be smaller than 20MB.");
  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const relativePath = `generated/${orderId}/${String(index + 1).padStart(2, "0")}${ext}`;
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));
  return { relativePath, absolutePath, mimeType: file.type };
}

export async function readStoredFile(relativePath: string) {
  return readFile(absoluteStoragePath(relativePath));
}
