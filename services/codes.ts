import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type RedeemCode = {
  code: string;
  status: "active" | "redeemed";
  redeemedAt: string | null;
  redeemedBy: string | null; // customer name
  orderId: string | null;
};

type CodeStore = {
  generatedAt: string;
  codes: RedeemCode[];
};

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

/** 校验兑换码并返回码信息（不修改状态） */
export function validateCode(code: string): RedeemCode | null {
  const store = readCodes();
  return store.codes.find((c) => c.code === code && c.status === "active") ?? null;
}

/** 兑换码：标记为已使用，返回是否成功 */
export function redeemCode(code: string, customerName: string, orderId: string): boolean {
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
export function listAllCodes(): RedeemCode[] {
  return readCodes().codes;
}

/** 获取统计信息 */
export function getCodeStats() {
  const codes = readCodes().codes;
  return {
    total: codes.length,
    active: codes.filter((c) => c.status === "active").length,
    redeemed: codes.filter((c) => c.status === "redeemed").length,
  };
}
