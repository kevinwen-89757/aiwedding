import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { appConfig } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
type StoredFile = { relativePath: string; absolutePath: string | null; mimeType: string };

export function isSupabaseStorage() {
  return appConfig.storageDriver === "supabase";
}
export function isS3Storage() {
  return appConfig.storageDriver === "s3";
}
/** Supabase / S3 这类云端存储使用 orders/ 前缀路径；本地存储用另一种布局 */
function isRemoteStorage() {
  return isSupabaseStorage() || isS3Storage();
}

export function absoluteStoragePath(relativePath: string) {
  return path.resolve(process.cwd(), appConfig.localStorageRoot, relativePath);
}

// ---------- Supabase Storage ----------
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

// ---------- S3 兼容存储（腾讯云 COS 等） ----------
let _s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  const s3 = appConfig.s3;
  if (!s3?.endpoint || !s3.region || !s3.bucket || !s3.accessKeyId || !s3.secretAccessKey) {
    throw new Error("S3 配置不完整：请在环境变量中设置 S3_ENDPOINT / S3_REGION / S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY。");
  }
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: s3.region,
      endpoint: s3.endpoint,
      credentials: { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey },
      forcePathStyle: false,
    });
  }
  return _s3Client;
}

async function uploadS3Object(relativePath: string, buffer: Buffer, mimeType: string) {
  const s3 = appConfig.s3;
  if (!s3?.bucket) throw new Error("S3_BUCKET 缺失，无法上传。");
  try {
    await getS3Client().send(new PutObjectCommand({
      Bucket: s3.bucket,
      Key: relativePath,
      Body: buffer,
      ContentType: mimeType,
    }));
  } catch (e: any) {
    throw new Error(`S3 上传失败：${e?.message ?? String(e)}`);
  }
}

async function readS3Object(relativePath: string): Promise<Buffer> {
  const s3 = appConfig.s3;
  if (!s3?.bucket) throw new Error("S3_BUCKET 缺失，无法读取。");
  try {
    const res = await getS3Client().send(new GetObjectCommand({ Bucket: s3.bucket, Key: relativePath }));
    if (!res.Body) throw new Error("S3 返回空文件");
    const bytes = await res.Body.transformToByteArray();
    return Buffer.from(bytes);
  } catch (e: any) {
    throw new Error(`S3 读取失败：${e?.message ?? String(e)}`);
  }
}

// ---------- 统一上传入口（按驱动分发） ----------
async function uploadObject(relativePath: string, buffer: Buffer, mimeType: string) {
  if (isSupabaseStorage()) {
    await uploadSupabaseObject(relativePath, buffer, mimeType);
  } else if (isS3Storage()) {
    await uploadS3Object(relativePath, buffer, mimeType);
  } else {
    const absolutePath = absoluteStoragePath(relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);
  }
}

function remotePath(prefix: string, fileName: string) {
  return `orders/${prefix}/${fileName}`;
}

/** 上传照片在 COS 中的统一相对路径；presign 与 saveUpload 必须共用，保证落库 key 一致 */
export function uploadRelativePath(orderId: string, role: "bride" | "groom", ext: string) {
  return remotePath(`${orderId}/uploads`, `${role}${ext}`);
}

export async function saveUpload(file: File, orderId: string, role?: "bride" | "groom"): Promise<StoredFile & { buffer: Buffer }> {
  if (!allowedMimeTypes.has(file.type)) throw new Error("Only JPEG, PNG, and WEBP images are supported.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image must be smaller than 15MB.");
  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const relativePath = isRemoteStorage()
    ? uploadRelativePath(orderId, (role ?? "bride"), ext)
    : `uploads/${orderId}/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadObject(relativePath, buffer, file.type);
  // 返回 buffer 供调用方（订单创建）在内存中直接计算尺寸，
  // 避免「上传后又从存储下载回来读元数据」的额外网络往返（Vercel 60s 超时的重要诱因）。
  return { relativePath, absolutePath: isRemoteStorage() ? null : absoluteStoragePath(relativePath), mimeType: file.type, buffer };
}

export async function saveGeneratedImage(buffer: Buffer, orderId: string, index: number): Promise<StoredFile> {
  const relativePath = isRemoteStorage()
    ? remotePath(`${orderId}/generated/original`, `${String(index + 1).padStart(2, "0")}.png`)
    : `generated/${orderId}/${String(index + 1).padStart(2, "0")}.png`;
  await uploadObject(relativePath, buffer, "image/png");
  return { relativePath, absolutePath: isRemoteStorage() ? null : absoluteStoragePath(relativePath), mimeType: "image/png" };
}

export async function saveGeneratedImageBuffer(buffer: Buffer, orderId: string, index: number, mimeType = "image/png", taskSuffix?: string): Promise<StoredFile> {
  const ext = mimeType === "image/jpeg" ? ".jpg" : mimeType === "image/webp" ? ".webp" : ".png";
  const fileBase = taskSuffix ? `${String(index + 1).padStart(2, "0")}-${taskSuffix}` : String(index + 1).padStart(2, "0");
  const relativePath = isRemoteStorage()
    ? remotePath(`${orderId}/generated/original`, `${fileBase}${ext}`)
    : `generated/${orderId}/${fileBase}${ext}`;
  await uploadObject(relativePath, buffer, mimeType);
  return { relativePath, absolutePath: isRemoteStorage() ? null : absoluteStoragePath(relativePath), mimeType };
}

export async function saveGeneratedUpload(file: File, orderId: string, index: number): Promise<StoredFile> {
  if (!allowedMimeTypes.has(file.type)) throw new Error("Only JPEG, PNG, and WEBP images are supported.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Generated image must be smaller than 20MB.");
  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const relativePath = isRemoteStorage()
    ? remotePath(`${orderId}/generated/original`, `${String(index + 1).padStart(2, "0")}${ext}`)
    : `generated/${orderId}/${String(index + 1).padStart(2, "0")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadObject(relativePath, buffer, file.type);
  return { relativePath, absolutePath: isRemoteStorage() ? null : absoluteStoragePath(relativePath), mimeType: file.type };
}

export async function savePreviewImageBuffer(buffer: Buffer, orderId: string, imageNumber: number, taskSuffix?: string) {
  const fileBase = taskSuffix ? `${String(imageNumber).padStart(2, "0")}-${taskSuffix}` : String(imageNumber).padStart(2, "0");
  const relativePath = isRemoteStorage()
    ? remotePath(`${orderId}/generated/preview`, `${fileBase}.jpg`)
    : `previews/${orderId}/${fileBase}.jpg`;
  await uploadObject(relativePath, buffer, "image/jpeg");
  return { relativePath, absolutePath: isRemoteStorage() ? null : absoluteStoragePath(relativePath), mimeType: "image/jpeg" };
}

export async function readStoredFile(relativePath: string) {
  if (isSupabaseStorage()) {
    if (!appConfig.supabaseStorageBucket) throw new Error("SUPABASE_STORAGE_BUCKET 缺失，无法读取 Supabase Storage。");
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage.from(appConfig.supabaseStorageBucket).download(relativePath);
    if (error) throw new Error(`Supabase Storage 读取失败：${error.message}`);
    return Buffer.from(await data.arrayBuffer());
  }
  if (isS3Storage()) {
    return readS3Object(relativePath);
  }
  return readFile(absoluteStoragePath(relativePath));
}

/** Overwrite a file at an existing relativePath (used for re-generating watermarks etc.) */
export async function overwriteStoredBuffer(relativePath: string, buffer: Buffer) {
  if (isSupabaseStorage()) {
    await uploadSupabaseObject(relativePath, buffer, "image/jpeg");
    return;
  }
  if (isS3Storage()) {
    await uploadS3Object(relativePath, buffer, "image/jpeg");
    return;
  }
  const absolutePath = absoluteStoragePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
}

// ---------- S3 JSON 文档读写（订单 / 兑换码等结构化数据） ----------
/** 结构化数据在 COS 中的统一前缀，避免和图片对象混在一起 */
export const COS_DATA_PREFIX = "data";

export async function readS3Json<T>(key: string): Promise<T | null> {
  try {
    const buf = await readS3Object(key);
    return JSON.parse(buf.toString("utf8")) as T;
  } catch (e: any) {
    const msg: string = e?.message ?? "";
    const status = e?.$metadata?.httpStatusCode;
    if (e?.name === "NoSuchKey" || status === 404 || /nosuchkey|404|not found|the specified key does not exist/i.test(msg)) {
      return null;
    }
    throw e;
  }
}

export async function writeS3Json(key: string, data: unknown) {
  await uploadS3Object(key, Buffer.from(JSON.stringify(data, null, 2), "utf8"), "application/json");
}

// ---------- S3 预签名上传（浏览器直传 COS，绕过 Vercel 60s 网关上限） ----------
/**
 * 生成 PUT 预签名 URL，供浏览器把照片直接上传到 COS（不经过 Vercel 函数），
 * 从而避免「大图经 Vercel 转发到 COS 超过 60s → 504」的问题。
 * 默认不在签名里绑定请求体（UNSIGNED-PAYLOAD），仅绑定 Content-Type 头，
 * 浏览器用相同 Content-Type 发起 PUT 即可。
 */
export async function presignPutObject(relativePath: string, contentType: string, expiresInSeconds = 600): Promise<string> {
  if (!isS3Storage()) throw new Error("当前存储后端不支持预签名上传，请使用 S3/COS 模式。");
  const s3 = appConfig.s3;
  if (!s3?.bucket) throw new Error("S3_BUCKET 缺失，无法生成预签名 URL。");
  try {
    return await getSignedUrl(
      getS3Client(),
      new PutObjectCommand({ Bucket: s3.bucket, Key: relativePath, ContentType: contentType }),
      { expiresIn: Math.min(Math.max(expiresInSeconds, 60), 3600) }
    );
  } catch (e: any) {
    throw new Error(`生成预签名 URL 失败：${e?.message ?? String(e)}`);
  }
}
