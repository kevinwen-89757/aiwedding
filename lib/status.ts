import type { OrderStatus } from "@/lib/types";

export function normalizeStatus(status: OrderStatus): OrderStatus {
  const map: Partial<Record<OrderStatus, OrderStatus>> = {
    awaiting_deposit: "pending_payment",
    theme_selection: "pending_theme",
    pending_review: "pending_review",
    ready_for_selection: "pending_selection",
    selection_payment_pending: "pending_final_payment",
    delivered: "completed",
    failed: "generation_failed"
  };
  return map[status] ?? status;
}

export const statusText: Record<OrderStatus, string> = {
  awaiting_deposit: "试看费待确认",
  theme_selection: "待选择风格",
  pending_review: "生成中",
  ready_to_generate: "待生成",
  generating: "生成中",
  ready_for_selection: "待选片",
  selection_payment_pending: "选片费待确认",
  delivered: "已完成",
  rejected: "已取消",
  failed: "生成失败",
  pending_payment: "试看费待确认",
  pending_theme: "待选择风格",
  pending_selection: "待选片",
  pending_final_payment: "选片费待确认",
  paid: "选片费已确认",
  completed: "已完成",
  generation_failed: "生成失败"
};

export function getStatusText(status: OrderStatus) {
  return statusText[status] ?? status;
}

export function getProgressIndex(status: OrderStatus) {
  const normalized = normalizeStatus(status);
  if (normalized === "pending_theme") return 1;
  if (normalized === "pending_payment") return 2;
  if (normalized === "generating") return 3;
  if (normalized === "pending_selection") return 4;
  if (normalized === "pending_final_payment" || normalized === "paid") return 5;
  if (normalized === "completed") return 6;
  return 0;
}
