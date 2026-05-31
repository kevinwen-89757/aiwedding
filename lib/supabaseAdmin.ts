import { createClient } from "@supabase/supabase-js";
import { appConfig } from "@/lib/config";

export function getSupabaseAdmin() {
  if (!appConfig.supabaseUrl) throw new Error("SUPABASE_URL 缺失，无法连接 Supabase。");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY 缺失，无法使用 Supabase 服务端权限。");
  return createClient(appConfig.supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
