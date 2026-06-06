import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, created_at, order_payload->customer_name, order_payload->customer_phone")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orders = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
  }));

  const toDelete = orders.filter((o) => o.status !== "completed");

  return NextResponse.json({
    total: orders.length,
    completed: orders.filter((o) => o.status === "completed").length,
    toDeleteCount: toDelete.length,
    toDelete,
  });
}

export async function DELETE(request: Request) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdmin();

  // 先查出所有非 completed 的 id
  const { data, error: listError } = await supabase
    .from("orders")
    .select("id, status")
    .neq("status", "completed");

  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const ids = (data ?? []).map((row: { id: string }) => row.id);
  if (ids.length === 0) return NextResponse.json({ ok: true, deleted: 0 });

  const { error: deleteError } = await supabase.from("orders").delete().in("id", ids);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ ok: true, deleted: ids.length, ids });
}
