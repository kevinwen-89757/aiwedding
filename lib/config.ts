export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  localStorageRoot: process.env.LOCAL_STORAGE_ROOT ?? "./storage",
  storageDriver: process.env.STORAGE_DRIVER === "supabase" ? "supabase" : "local",
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET,
  generationMode: process.env.GENERATION_MODE === "manual" || process.env.GENERATION_MODE === "api" ? process.env.GENERATION_MODE : "mock",
  generationProvider: process.env.GENERATION_PROVIDER === "apimart" ? "apimart" : null,
  geminiApiKey: process.env.GOOGLE_GEMINI_API_KEY,
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL ?? "gemini-3-pro-image-preview",
  geminiMockGeneration: process.env.GEMINI_MOCK_GENERATION !== "false",
  apimartApiKey: process.env.APIMART_API_KEY,
  apimartBaseUrl: process.env.APIMART_BASE_URL ?? "https://api.apimart.ai",
  apimartModel: process.env.APIMART_MODEL ?? "gemini-3-pro-image-preview",
  apimartResolution: process.env.APIMART_RESOLUTION ?? "1K",
  apimartTimeoutMs: Number.parseInt(process.env.APIMART_TIMEOUT_MS ?? "300000", 10),
  generationTestLimit: process.env.GENERATION_TEST_LIMIT ? Number.parseInt(process.env.GENERATION_TEST_LIMIT, 10) : 0,
  adminToken: process.env.ADMIN_TOKEN ?? (process.env.NODE_ENV === "production" ? "" : "dev-admin-token")
};

export function assertProductionConfig() {
  if (process.env.NODE_ENV === "production" && (!appConfig.adminToken || appConfig.adminToken === "dev-admin-token")) {
    throw new Error("ADMIN_TOKEN must be configured to a non-default value in production.");
  }
}
