import path from "node:path";
import { appConfig } from "@/lib/config";

type JsonRecord = Record<string, unknown>;

export type ApimartGeneratedImage = {
  buffer: Buffer;
  mimeType: string;
  imageUrl: string;
};

export type ApimartTaskResult = {
  taskId: string;
  status: string;
  imageUrl: string;
  raw: unknown;
};

export type ApimartTaskStatus = {
  taskId: string;
  status: string;
  imageUrl: string | null;
  raw: unknown;
};

function apiKey() {
  if (!appConfig.apimartApiKey) throw new Error("APIMART_API_KEY 未配置，无法调用 APIMart 生成。");
  return appConfig.apimartApiKey;
}

function baseUrl() {
  return appConfig.apimartBaseUrl.replace(/\/+$/, "");
}

function redactSecret(message: string) {
  return appConfig.apimartApiKey ? message.replaceAll(appConfig.apimartApiKey, "[redacted]") : message;
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function getRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : null;
}

function getPath(value: unknown, keys: (string | number)[]) {
  let current = value;
  for (const key of keys) {
    if (typeof key === "number") {
      if (!Array.isArray(current)) return undefined;
      current = current[key];
      continue;
    }
    const record = getRecord(current);
    if (!record) return undefined;
    current = record[key];
  }
  return current;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function firstStringFromArray(value: unknown) {
  if (!Array.isArray(value)) return null;
  for (const item of value) {
    if (typeof item === "string" && item.trim()) return item.trim();
  }
  return null;
}

function extractUploadUrl(json: unknown) {
  return firstString(
    getPath(json, ["url"]),
    getPath(json, ["data", "url"]),
    getPath(json, ["data", 0, "url"]),
    getPath(json, ["image", "url"])
  );
}

function extractTaskId(json: unknown) {
  return firstString(
    getPath(json, ["data", 0, "task_id"]),
    getPath(json, ["data", "task_id"]),
    getPath(json, ["task_id"]),
    getPath(json, ["id"]),
    getPath(json, ["data", "id"])
  );
}

function extractTaskStatus(json: unknown) {
  return firstString(getPath(json, ["status"]), getPath(json, ["data", "status"]), getPath(json, ["state"]), getPath(json, ["data", "state"])) ?? "unknown";
}

function extractErrorMessage(json: unknown) {
  return firstString(
    getPath(json, ["error", "message"]),
    getPath(json, ["data", "error", "message"]),
    getPath(json, ["message"]),
    getPath(json, ["data", "message"]),
    getPath(json, ["error"])
  );
}

function extractResultImageUrl(json: unknown) {
  const urlArray = getPath(json, ["data", "result", "images", 0, "url"]);
  return firstString(
    firstStringFromArray(urlArray),
    getPath(json, ["data", "result", "images", 0, "url"]),
    getPath(json, ["result", "images", 0, "url"]),
    getPath(json, ["data", "images", 0, "url"]),
    getPath(json, ["data", "output", 0, "url"]),
    getPath(json, ["data", "url"]),
    getPath(json, ["url"])
  );
}

function failureFromJson(json: unknown, fallback: string) {
  const message = extractErrorMessage(json);
  return redactSecret(message ? `${fallback}: ${message}` : fallback);
}

function summarizeJson(json: unknown) {
  return redactSecret(JSON.stringify(json).slice(0, 600));
}

export async function apimartUploadImage(input: { buffer: Buffer; mimeType: string; filename?: string }) {
  const form = new FormData();
  const filename = input.filename ?? `upload${input.mimeType === "image/png" ? ".png" : input.mimeType === "image/webp" ? ".webp" : ".jpg"}`;
  const bytes = new Uint8Array(input.buffer.length);
  bytes.set(input.buffer);
  form.append("file", new Blob([bytes], { type: input.mimeType }), path.basename(filename));

  const response = await fetch(`${baseUrl()}/v1/uploads/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form
  });
  const json = await readJson(response);
  if (!response.ok) throw new Error(failureFromJson(json, `APIMart 上传用户照片失败，HTTP ${response.status}`));
  const url = extractUploadUrl(json);
  if (!url) throw new Error("APIMart 上传用户照片成功，但响应中没有 url。");
  return url;
}

export async function apimartCreateGenerationTask(input: { prompt: string; uploadedImageUrls: string[]; aspectRatio?: string | null }) {
  const imageUrls = input.uploadedImageUrls.filter((url) => url.trim());
  if (imageUrls.length < 1) throw new Error("APIMart 生成任务缺少参考图 URL。");
  const body: JsonRecord = {
    model: appConfig.apimartModel,
    prompt: input.prompt,
    image_urls: imageUrls,
    resolution: appConfig.apimartResolution
  };
  if (input.aspectRatio) body.size = input.aspectRatio;
  console.log("[apimart] create generation body debug", {
    model: body.model,
    hasPrompt: Boolean(body.prompt),
    imageUrlsType: Array.isArray(body.image_urls) ? "array" : typeof body.image_urls,
    imageUrlsCount: Array.isArray(body.image_urls) ? body.image_urls.length : 0,
    firstImageUrlType: Array.isArray(body.image_urls) ? typeof body.image_urls[0] : "undefined",
    secondImageUrlType: Array.isArray(body.image_urls) ? typeof body.image_urls[1] : "undefined",
    size: body.size,
    resolution: body.resolution
  });

  const response = await fetch(`${baseUrl()}/v1/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const json = await readJson(response);
  if (!response.ok) throw new Error(failureFromJson(json, `APIMart 创建生成任务失败，HTTP ${response.status}`));
  const taskId = extractTaskId(json);
  if (!taskId) throw new Error("APIMart 创建生成任务成功，但响应中没有 task_id。");
  return { taskId, raw: json };
}

async function getTask(taskId: string) {
  const response = await fetch(`${baseUrl()}/v1/tasks/${encodeURIComponent(taskId)}?language=zh`, {
    headers: { Authorization: `Bearer ${apiKey()}` }
  });
  const json = await readJson(response);
  if (!response.ok) throw new Error(`${failureFromJson(json, `APIMart 查询任务失败，HTTP ${response.status}`)}；body=${summarizeJson(json)}`);
  return json;
}

export async function apimartGetTaskStatus(taskId: string): Promise<ApimartTaskStatus> {
  const raw = await getTask(taskId);
  return {
    taskId,
    status: extractTaskStatus(raw).toLowerCase(),
    imageUrl: extractResultImageUrl(raw),
    raw
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apimartPollTask(taskId: string): Promise<ApimartTaskResult> {
  const timeoutMs = Number.isFinite(appConfig.apimartTimeoutMs) ? appConfig.apimartTimeoutMs : 180000;
  const startedAt = Date.now();
  let latest: unknown = null;
  while (Date.now() - startedAt <= timeoutMs) {
    latest = await getTask(taskId);
    const status = extractTaskStatus(latest).toLowerCase();
    if (["completed", "complete", "success", "succeeded", "done"].includes(status)) {
      const imageUrl = extractResultImageUrl(latest);
      if (!imageUrl) throw new Error(`APIMart 任务 ${taskId} 已完成，但没有返回结果图片 URL。`);
      return { taskId, status, imageUrl, raw: latest };
    }
    if (["failed", "failure", "cancelled", "canceled", "error"].includes(status)) {
      throw new Error(failureFromJson(latest, `APIMart 任务 ${taskId} 失败`));
    }
    await wait(3000);
  }
  throw new Error(`APIMart 任务 ${taskId} 超时，已等待 ${timeoutMs}ms。`);
}

export async function apimartDownloadImage(imageUrl: string): Promise<ApimartGeneratedImage> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`下载 APIMart 生成图失败，HTTP ${response.status}。`);
  const contentType = response.headers.get("content-type") ?? "image/png";
  const mimeType = contentType.includes("webp") ? "image/webp" : contentType.includes("jpeg") || contentType.includes("jpg") ? "image/jpeg" : "image/png";
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    mimeType,
    imageUrl
  };
}
