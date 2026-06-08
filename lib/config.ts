function detectStorageDriver(): "supabase" | "s3" | "local" {
  // Explicit override takes precedence
  if (process.env.STORAGE_DRIVER === "supabase") return "supabase";
  if (process.env.STORAGE_DRIVER === "s3") return "s3";
  if (process.env.STORAGE_DRIVER === "local") return "local";
  // Auto-detect: use supabase if configured (Vercel production default)
  if (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) return "supabase";
  if (process.env.S3_BUCKET && process.env.S3_ENDPOINT) return "s3";
  return "local";
}

export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  localStorageRoot: process.env.LOCAL_STORAGE_ROOT ?? "./storage",
  storageDriver: detectStorageDriver(),
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET,
  s3Provider: process.env.S3_PROVIDER ?? "s3",
  s3Region: process.env.S3_REGION ?? "",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
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
