import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type RedeemCode = {
  code: string;
  status: "active" | "redeemed";
  redeemed_at: string | null;
  redeemed_by: string | null;
  order_id: string | null;
};

type RedeemCodeRow = {
  code: string;
  status: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
  order_id: string | null;
};

function rowToCode(row: RedeemCodeRow): RedeemCode {
  return {
    code: row.code,
    status: row.status as "active" | "redeemed",
    redeemed_at: row.redeemed_at,
    redeemed_by: row.redeemed_by,
    order_id: row.order_id,
  };
}

export async function listSupabaseCodes(): Promise<RedeemCode[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("redeem_codes")
    .select("*")
    .order("code", { ascending: true });
  if (error) throw new Error(`Supabase redeem_codes 读取失败：${error.message}`);
  return (data ?? []).map((row) => rowToCode(row as RedeemCodeRow));
}

export async function getSupabaseCode(code: string): Promise<RedeemCode | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("redeem_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(`Supabase redeem_codes 查询失败：${error.message}`);
  return data ? rowToCode(data as RedeemCodeRow) : null;
}

/** 核销兑换码：将状态标记为 redeemed */
export async function redeemSupabaseCode(
  code: string,
  redeemedBy: string,
  orderId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("redeem_codes")
    .update({
      status: "redeemed",
      redeemed_at: now,
      redeemed_by: redeemedBy,
      order_id: orderId,
    })
    .eq("code", code)
    .eq("status", "active"); // 仅更新状态为 active 的记录
  if (error) throw new Error(`Supabase redeem_codes 核销失败：${error.message}`);
  return true;
}

/** 批量导入兑换码 */
export async function batchInsertSupabaseCodes(
  codes: { code: string; status?: string }[]
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const rows = codes.map((c) => ({
    code: c.code,
    status: c.status ?? "active",
    redeemed_at: null,
    redeemed_by: null,
    order_id: null,
  }));
  const { error } = await supabase
    .from("redeem_codes")
    .upsert(rows, { onConflict: "code", ignoreDuplicates: true });
  if (error) throw new Error(`Supabase redeem_codes 批量导入失败：${error.message}`);

  // 查询实际导入数量
  const { count, error: countError } = await supabase
    .from("redeem_codes")
    .select("*", { count: "exact", head: true });
  if (countError) throw new Error(`查询导入数量失败：${countError.message}`);
  return count ?? 0;
}

/** 获取统计 */
export async function getSupabaseCodeStats() {
  const supabase = getSupabaseAdmin();
  const { count: total, error: totalError } = await supabase
    .from("redeem_codes")
    .select("*", { count: "exact", head: true });
  if (totalError) throw new Error(`统计失败：${totalError.message}`);

  const { count: active, error: activeError } = await supabase
    .from("redeem_codes")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  if (activeError) throw new Error(`统计失败：${activeError.message}`);

  const { count: redeemed, error: redeemedError } = await supabase
    .from("redeem_codes")
    .select("*", { count: "exact", head: true })
    .eq("status", "redeemed");
  if (redeemedError) throw new Error(`统计失败：${redeemedError.message}`);

  return {
    total: total ?? 0,
    active: active ?? 0,
    redeemed: redeemed ?? 0,
  };
}

/** 验证 Supabase redeem_codes 表可用性 */
export async function assertSupabaseCodesReady() {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("redeem_codes").select("code").limit(1);
  if (error) throw new Error(`Supabase redeem_codes 表不可用：${error.message}`);
}
