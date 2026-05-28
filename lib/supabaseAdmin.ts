import { createClient } from "@supabase/supabase-js";
import { appConfig } from "@/lib/config";

export function getSupabaseAdmin() {
  if (!appConfig.supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for STORAGE_DRIVER=supabase.");
  }
  return createClient(appConfig.supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
