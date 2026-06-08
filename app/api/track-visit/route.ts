import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const page = body.page || "home";
    const supabase = getSupabaseAdmin();
    await supabase.from("site_visits").insert({ page });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Silently fail if table doesn't exist - analytics are non-critical
    if (msg.includes("site_visits") || msg.includes("does not exist") || msg.includes("relation")) {
      return NextResponse.json({ ok: false, error: "site_visits 表不存在，请在 Supabase 中执行 SQL 创建。" });
    }
    return NextResponse.json({ ok: false, error: msg });
  }
}
