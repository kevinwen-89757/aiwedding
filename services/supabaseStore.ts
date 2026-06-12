import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { LocalOrder } from "@/services/localStore";

type SupabaseOrderRow = {
  id: string;
  status: string;
  order_payload: LocalOrder;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function listSupabaseOrders() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("id,status,order_payload,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Supabase order read failed: ${error.message}`);
  return (data ?? []).map((row) => (row as SupabaseOrderRow).order_payload);
}

export async function getSupabaseOrder(orderId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("order_payload")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(`Supabase order read failed: ${error.message}`);
  return data ? ((data as Pick<SupabaseOrderRow, "order_payload">).order_payload ?? null) : null;
}

export async function saveSupabaseOrder(order: LocalOrder) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("orders").upsert({
    id: order.id,
    status: order.status,
    order_payload: JSON.parse(JSON.stringify(order)) as LocalOrder,
    created_at: order.created_at,
    updated_at: order.updated_at
  }, { onConflict: "id" });
  if (error) throw new Error(`Supabase orders 写入失败：${error.message}`);
}

export async function deleteSupabaseOrder(orderId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) throw new Error(`Supabase order delete failed: ${error.message}`);
}

export async function assertSupabaseStoreReady() {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("orders").select("id").limit(1);
  if (error) throw new Error(`Supabase orders 表不可用：${error.message}`);
}
