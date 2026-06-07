"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminConfirmButtons({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function confirmDeposit() {
    setBusy("deposit");
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "confirm_deposit" }),
    });
    setBusy(null);
    if (res.ok) { router.refresh(); return; }
    alert("确认失败，请重试");
  }

  async function startGeneration() {
    setBusy("generate");
    const res = await fetch(`/api/admin/orders/${orderId}/start-generation`, { method: "POST" });
    setBusy(null);
    if (res.ok) { router.refresh(); return; }
    const err = await res.json().catch(() => ({}));
    if (res.status === 409) {
      // 可能是状态已变（如自动触发已开始），刷新页面即可
      router.refresh();
      return;
    }
    alert("生成启动失败：" + (err.error || "未知错误"));
  }

  async function confirmSelection() {
    setBusy("selection");
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "confirm_selection" }),
    });
    setBusy(null);
    if (res.ok) { router.refresh(); return; }
    alert("确认失败，请重试");
  }

  const needsDepositConfirm = status === "awaiting_deposit" || status === "pending_payment";
  const needsGenerate = status === "ready_to_generate";
  const needsSelectionConfirm = status === "pending_final_payment" || status === "selection_payment_pending";

  if (!needsDepositConfirm && !needsGenerate && !needsSelectionConfirm) return null;

  return (
    <div className="admin-confirm-actions">
      {needsDepositConfirm && (
        <button className="button" onClick={confirmDeposit} disabled={busy !== null}>
          {busy === "deposit" ? "确认中..." : "确认试看费已到账"}
        </button>
      )}
      {needsGenerate && (
        <button className="button primary" onClick={startGeneration} disabled={busy !== null}>
          {busy === "generate" ? "启动中..." : "开始 AI 生成"}
        </button>
      )}
      {needsSelectionConfirm && (
        <button className="button" onClick={confirmSelection} disabled={busy !== null}>
          {busy === "selection" ? "确认中..." : "确认选片费已到账"}
        </button>
      )}
    </div>
  );
}
