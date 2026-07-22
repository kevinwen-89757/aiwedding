const storageDriver: "local" | "supabase" | "s3" =
  process.env.STORAGE_DRIVER === "supabase" ? "supabase"
  : process.env.STORAGE_DRIVER === "s3" ? "s3"
  : "local";

export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  localStorageRoot: process.env.LOCAL_STORAGE_ROOT ?? "./storage",
  storageDriver,
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET,
  // S3 兼容存储（腾讯云 COS 等）。仅当 S3_ENDPOINT 与 S3_BUCKET 都配置时才启用。
  s3: process.env.S3_ENDPOINT && process.env.S3_BUCKET ? {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "ap-guangzhou",
    bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  } : undefined,
  generationMode: process.env.GENERATION_MODE === "manual" || process.env.GENERATION_MODE === "api" ? process.env.GENERATION_MODE : "mock",
  generationProvider: process.env.GENERATION_PROVIDER === "apimart" ? "apimart" : null,
  geminiApiKey: process.env.GOOGLE_GEMINI_API_KEY,
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL ?? "gemini-3-pro-image-preview",
  geminiMockGeneration: process.env.GEMINI_MOCK_GENERATION !== "false",
  apimartApiKey: process.env.APIMART_API_KEY,
  apimartBaseUrl: process.env.APIMART_BASE_URL ?? "https://api.apimart.ai",
  apimartModel: process.env.APIMART_MODEL ?? "gemini-3-pro-image-preview",
  // 强制 4K，忽略环境变量（避免 Vercel 缓存旧值）
  apimartResolution: "4K",
  apimartTimeoutMs: Number.parseInt(process.env.APIMART_TIMEOUT_MS ?? "300000", 10),
  generationTestLimit: process.env.GENERATION_TEST_LIMIT ? Number.parseInt(process.env.GENERATION_TEST_LIMIT, 10) : 0,
  adminToken: process.env.ADMIN_TOKEN ?? (process.env.NODE_ENV === "production" ? "" : "dev-admin-token"),
  wechatPay: {
    appId: process.env.WECHAT_PAY_APPID ?? "",
    mchId: process.env.WECHAT_PAY_MCHID ?? "",
    apiKey: process.env.WECHAT_PAY_API_KEY ?? "",
  },
};

export function assertProductionConfig() {
  if (process.env.NODE_ENV === "production" && (!appConfig.adminToken || appConfig.adminToken === "dev-admin-token")) {
    throw new Error("ADMIN_TOKEN must be configured to a non-default value in production.");
  }
}
