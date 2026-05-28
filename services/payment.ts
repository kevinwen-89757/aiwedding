import { randomUUID } from "node:crypto";

export function createMockTradeNo(prefix: string) {
  return `${prefix}_${Date.now()}_${randomUUID().slice(0, 8)}`;
}
