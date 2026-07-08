import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { appConfig } from "@/lib/config";
import {
  listSupabaseCodes,
  getSupabaseCode,
  redeemSupabaseCode,
  getSupabaseCodeStats,
} from "@/services/supabaseCodes";

export type RedeemCode = {
  code: string;
  status: "active" | "redeemed";
  redeemedAt: string | null;
  redeemedBy: string | null;
  orderId: string | null;
};

type CodeStore = {
  generatedAt: string;
  codes: RedeemCode[];
};

// ─── Local JSON helpers (开发环境回退) ──────────────────────────────────────

function codesFilePath() {
  return path.resolve(process.cwd(), "data/redeem-codes.json");
}

function readCodes(): CodeStore {
  try {
    const raw = readFileSync(codesFilePath(), "utf-8");
    return JSON.parse(raw) as CodeStore;
  } catch {
    return { generatedAt: "", codes: [] };
  }
}

function writeCodes(store: CodeStore) {
  writeFileSync(codesFilePath(), JSON.stringify(store, null, 2), "utf-8");
}

function isSupabaseStore() {
  return appConfig.storageDriver === "supabase";
}

/** 校验兑换码并返回码信息（不修改状态） */
export async function validateCode(code: string): Promise<RedeemCode | null> {
  if (isSupabaseStore()) {
    const found = await getSupabaseCode(code);
    if (!found || found.status !== "active") return null;
    // 转换为前端兼容格式
    return {
      code: found.code,
      status: found.status,
      redeemedAt: found.redeemed_at,
      redeemedBy: found.redeemed_by,
      orderId: found.order_id,
    };
  }
  // 本地 JSON 回退
  const store = readCodes();
  return store.codes.find((c) => c.code === code && c.status === "active") ?? null;
}

/** 兑换码：标记为已使用，返回是否成功 */
export async function redeemCode(
  code: string,
  customerName: string,
  orderId: string
): Promise<boolean> {
  if (isSupabaseStore()) {
    await redeemSupabaseCode(code, customerName, orderId);
    return true;
  }
  // 本地 JSON 回退
  const store = readCodes();
  const found = store.codes.find((c) => c.code === code && c.status === "active");
  if (!found) return false;
  found.status = "redeemed";
  found.redeemedAt = new Date().toISOString();
  found.redeemedBy = customerName;
  found.orderId = orderId;
  writeCodes(store);
  return true;
}

/** 获取所有兑换码（用于后台管理） */
export async function listAllCodes(): Promise<RedeemCode[]> {
  if (isSupabaseStore()) {
    const codes = await listSupabaseCodes();
    return codes.map((c) => ({
      code: c.code,
      status: c.status,
      redeemedAt: c.redeemed_at,
      redeemedBy: c.redeemed_by,
      orderId: c.order_id,
    }));
  }
  return readCodes().codes;
}

/** 获取统计信息 */
export async function getCodeStats() {
  if (isSupabaseStore()) {
    return await getSupabaseCodeStats();
  }
  const codes = readCodes().codes;
  return {
    total: codes.length,
    active: codes.filter((c) => c.status === "active").length,
    redeemed: codes.filter((c) => c.status === "redeemed").length,
  };
}
