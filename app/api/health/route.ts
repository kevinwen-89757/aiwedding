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
    storageReady
  });
}
