import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;

  try {
    const supabase = getSupabaseAdmin();

    // Today's visits
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todayData, error: todayError } = await supabase
      .from("site_visits")
      .select("visited_at")
      .gte("visited_at", todayStart.toISOString());

    if (todayError) throw todayError;

    // Weekly visits (last 7 days)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const { data: weekData, error: weekError } = await supabase
      .from("site_visits")
      .select("visited_at")
      .gte("visited_at", weekStart.toISOString());

    if (weekError) throw weekError;

    // Monthly visits (last 30 days)
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);
    const { data: monthData, error: monthError } = await supabase
      .from("site_visits")
      .select("visited_at")
      .gte("visited_at", monthStart.toISOString());

    if (monthError) throw monthError;

    // Hourly distribution for today
    const hourlyCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourlyCounts[i] = 0;
    todayData?.forEach((v: { visited_at: string }) => {
      const hour = new Date(v.visited_at).getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });

    return NextResponse.json({
      ok: true,
      today: todayData?.length || 0,
      week: weekData?.length || 0,
      month: monthData?.length || 0,
      hourly: hourlyCounts,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("site_visits") || msg.includes("does not exist") || msg.includes("relation")) {
      return NextResponse.json({
        ok: false,
        error: "site_visits 表不存在",
        setupSql: `CREATE TABLE site_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page text DEFAULT 'home',
  visited_at timestamptz DEFAULT now()
);`,
      });
    }
    return NextResponse.json({ ok: false, error: msg });
  }
}
