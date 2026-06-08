import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { appConfig } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
type StoredFile = { relativePath: string; absolutePath: string | null; mimeType: string };

/* ─────────── 远程存储判断 ─────────── */

function isRemoteStorage() {
  return appConfig.storageDriver === "supabase" || appConfig.storageDriver === "s3";
}

export function isSupabaseStorage() {
  return appConfig.storageDriver === "supabase";
}

export function isS3Storage() {
  return appConfig.storageDriver === "s3";
}

export function absoluteStoragePath(relativePath: string) {
  return path.resolve(process.cwd(), appConfig.localStorageRoot, relativePath);
}

/* ─────────── Supabase 上传 ─────────── */

async function uploadSupabaseObject(relativePath: string, buffer: Buffer, mimeType: string) {
  if (!appConfig.supabaseUrl) throw new Error("SUPABASE_URL 缺失，无法上传到 Supabase Storage。");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY 缺失，无法上传到 Supabase Storage。");
  if (!appConfig.supabaseStorageBucket) throw new Error("SUPABASE_STORAGE_BUCKET 缺失，无法上传到 Supabase Storage。");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(appConfig.supabaseStorageBucket).upload(relativePath, buffer, {
    contentType: mimeType,
    upsert: true
  });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("bucket") && message.includes("not found")) throw new Error(`Supabase Storage bucket 不存在：${appConfig.supabaseStorageBucket}`);
    if (message.includes("permission") || message.includes("policy") || message.includes("unauthorized") || message.includes("jwt")) throw new Error(`Supabase Storage 权限问题：${error.message}`);
    if (message.includes("payload") || message.includes("too large") || message.includes("size")) throw new Error(`Supabase Storage 文件过大：${error.message}`);
    throw new Error(`Supabase Storage 上传失败：${error.message}`);
  }
}

/* ─────────── S3 / 腾讯云 COS ─────────── */

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;
  if (!appConfig.s3AccessKeyId || !appConfig.s3SecretAccessKey) {
    throw new Error("S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY 缺失，无法使用 S3/COS 存储。");
  }
  if (!appConfig.s3Endpoint) throw new Error("S3_ENDPOINT 缺失，无法使用 S3/COS 存储。");
  if (!appConfig.s3Bucket) throw new Error("S3_BUCKET 缺失，无法使用 S3/COS 存储。");
  if (!appConfig.s3Region) throw new Error("S3_REGION 缺失，无法使用 S3/COS 存储。");
  console.log("[storage] 初始化 S3Client...", { region: appConfig.s3Region, bucket: appConfig.s3Bucket, endpoint: appConfig.s3Endpoint });
  s3Client = new S3Client({
    region: appConfig.s3Region,
    endpoint: appConfig.s3Endpoint,
    credentials: {
      accessKeyId: appConfig.s3AccessKeyId,
      secretAccessKey: appConfig.s3SecretAccessKey,
    },
    forcePathStyle: false, // 腾讯云 COS 使用 virtual-hosted style
  });
  return s3Client;
}

async function uploadS3Object(relativePath: string, buffer: Buffer, mimeType: string) {
  const client = getS3Client();
  // 30秒超时，防止 Vercel Function 被挂起
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    console.log(`[storage] S3 PutObject 开始: ${relativePath} (${(buffer.length / 1024).toFixed(0)}KB)`);
    const t0 = Date.now();
    await client.send(new PutObjectCommand({
      Bucket: appConfig.s3Bucket,
      Key: relativePath,
      Body: buffer,
      ContentType: mimeType,
    }), { abortSignal: controller.signal });
    console.log(`[storage] S3 PutObject 完成: ${relativePath}，耗时 ${Date.now() - t0}ms`);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`S3/COS 上传超时（>30s）：${relativePath}，大小 ${(buffer.length / 1024).toFixed(0)}KB`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readS3Object(relativePath: string): Promise<Buffer> {
  const client = getS3Client();
  const response = await client.send(new GetObjectCommand({
    Bucket: appConfig.s3Bucket,
    Key: relativePath,
  }));
  if (!response.Body) throw new Error(`S3/COS 读取失败：${relativePath} 返回空内容`);
  const chunks: Buffer[] = [];
  // @ts-expect-error Body is a web stream in Node 18+
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/* ─────────── 统一远程上传/读取 ─────────── */

async function uploadRemoteObject(relativePath: string, buffer: Buffer, mimeType: string) {
  if (appConfig.storageDriver === "supabase") {
    await uploadSupabaseObject(relativePath, buffer, mimeType);
  } else {
    await uploadS3Object(relativePath, buffer, mimeType);
  }
}

async function readRemoteObject(relativePath: string): Promise<Buffer> {
  if (appConfig.storageDriver === "supabase") {
    if (!appConfig.supabaseStorageBucket) throw new Error("SUPABASE_STORAGE_BUCKET 缺失，无法读取 Supabase Storage。");
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(appConfig.supabaseStorageBucket).download(relativePath);
    if (error) throw new Error(`Supabase Storage 读取失败：${error.message}`);
    return Buffer.from(await data.arrayBuffer());
  }
  return readS3Object(relativePath);
}

/* ─────────── 公开 API ─────────── */

export async function saveUpload(file: File, orderId: string, role?: "bride" | "groom"): Promise<StoredFile> {
  if (!allowedMimeTypes.has(file.type)) throw new Error("Only JPEG, PNG, and WEBP images are supported.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image must be smaller than 15MB.");
  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const relativePath = isRemoteStorage()
    ? `orders/${orderId}/uploads/${role ?? randomUUID()}${ext}`
    : `uploads/${orderId}/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  if (isRemoteStorage()) {
    await uploadRemoteObject(relativePath, buffer, file.type);
    return { relativePath, absolutePath: null, mimeType: file.type };
  }
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return { relativePath, absolutePath, mimeType: file.type };
}

export async function saveGeneratedImage(buffer: Buffer, orderId: string, index: number): Promise<StoredFile> {
  const relativePath = isRemoteStorage()
    ? `orders/${orderId}/generated/original/${String(index + 1).padStart(2, "0")}.png`
    : `generated/${orderId}/${String(index + 1).padStart(2, "0")}.png`;
  if (isRemoteStorage()) {
    await uploadRemoteObject(relativePath, buffer, "image/png");
    return { relativePath, absolutePath: null, mimeType: "image/png" };
  }
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return { relativePath, absolutePath, mimeType: "image/png" };
}

export async function saveGeneratedImageBuffer(buffer: Buffer, orderId: string, index: number, mimeType = "image/png", taskSuffix?: string, fallbackUrl?: string): Promise<StoredFile> {
  const ext = mimeType === "image/jpeg" ? ".jpg" : mimeType === "image/webp" ? ".webp" : ".png";
  const fileBase = taskSuffix ? `${String(index + 1).padStart(2, "0")}-${taskSuffix}` : String(index + 1).padStart(2, "0");
  const relativePath = isRemoteStorage()
    ? `orders/${orderId}/generated/original/${fileBase}${ext}`
    : `generated/${orderId}/${fileBase}${ext}`;
  if (isRemoteStorage()) {
    try {
      await uploadRemoteObject(relativePath, buffer, mimeType);
      return { relativePath, absolutePath: null, mimeType };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[storage] uploadRemoteObject failed for ${relativePath}: ${msg}. Using fallback URL if available.`);
      // If fallbackUrl provided, use it as the path (readStoredFile will fetch from URL)
      if (fallbackUrl) {
        return { relativePath: fallbackUrl, absolutePath: null, mimeType };
      }
      throw err;
    }
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
  const relativePath = isRemoteStorage()
    ? `orders/${orderId}/generated/original/${String(index + 1).padStart(2, "0")}${ext}`
    : `generated/${orderId}/${String(index + 1).padStart(2, "0")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  if (isRemoteStorage()) {
    await uploadRemoteObject(relativePath, buffer, file.type);
    return { relativePath, absolutePath: null, mimeType: file.type };
  }
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return { relativePath, absolutePath, mimeType: file.type };
}

export async function savePreviewImageBuffer(buffer: Buffer, orderId: string, imageNumber: number, taskSuffix?: string, fallbackUrl?: string) {
  const fileBase = taskSuffix ? `${String(imageNumber).padStart(2, "0")}-${taskSuffix}` : String(imageNumber).padStart(2, "0");
  const relativePath = isRemoteStorage()
    ? `orders/${orderId}/generated/preview/${fileBase}.jpg`
    : `previews/${orderId}/${fileBase}.jpg`;
  if (isRemoteStorage()) {
    try {
      await uploadRemoteObject(relativePath, buffer, "image/jpeg");
      return { relativePath, absolutePath: null, mimeType: "image/jpeg" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[storage] uploadRemoteObject failed for preview ${relativePath}: ${msg}. Using fallback URL if available.`);
      if (fallbackUrl) {
        return { relativePath: fallbackUrl, absolutePath: null, mimeType: "image/jpeg" };
      }
      throw err;
    }
  }
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return { relativePath, absolutePath, mimeType: "image/jpeg" };
}

export async function readStoredFile(relativePath: string) {
  // Support external URLs (e.g. APIMart direct image URLs) as stored paths
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    const response = await fetch(relativePath, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Failed to fetch image from URL: ${relativePath}, status: ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
  if (isRemoteStorage()) {
    return readRemoteObject(relativePath);
  }
  return readFile(absoluteStoragePath(relativePath));
}

/** Overwrite a file at an existing relativePath (used for re-generating watermarks etc.) */
export async function overwriteStoredBuffer(relativePath: string, buffer: Buffer) {
  if (isRemoteStorage()) {
    await uploadRemoteObject(relativePath, buffer, "image/jpeg");
    return;
  }
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
}
