"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminConfirmButtons({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function startGeneration() {
    setBusy("generate");
    const res = await fetch(`/api/admin/orders/${orderId}/start-generation`, { method: "POST" });
    setBusy(null);
    if (res.ok) { router.refresh(); return; }
    const err = await res.json().catch(() => ({}));
    if (res.status === 409) {
      router.refresh();
      return;
    }
    alert("生成启动失败：" + (err.error || "未知错误"));
  }

  const needsGenerate = status === "ready_to_generate";

  if (!needsGenerate) return null;

  return (
    <div className="admin-confirm-actions">
      {needsGenerate && (
        <button className="button primary" onClick={startGeneration} disabled={busy !== null}>
          {busy === "generate" ? "启动中..." : "开始 AI 生成"}
        </button>
      )}
    </div>
  );
}
