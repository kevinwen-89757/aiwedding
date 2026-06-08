import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { ensureLocalStore } from "@/services/localStore";

export async function GET() {
  let storageReady = true;
  try {
    await ensureLocalStore();
  } catch {
    storageReady = false;
  }
  return NextResponse.json({
    ok: storageReady,
    mode: appConfig.generationMode,
    provider: appConfig.generationProvider,
    storageDriver: appConfig.storageDriver,
    storageReady,
    env: {
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasS3Bucket: Boolean(process.env.S3_BUCKET),
      storageDriverEnv: process.env.STORAGE_DRIVER || null,
    }
  });
}
