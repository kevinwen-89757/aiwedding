"use client";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { OrderStatus } from "@/lib/types";

type Props = {
  orderId: string;
  status: OrderStatus;
  progress: number;
  stageText: string;
  helperText: string;
  queueText?: string;
  canAutoRefresh: boolean;
};

export function OrderStatusProgress({ orderId, status, progress, stageText, helperText, queueText, canAutoRefresh }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const refreshProgress = useCallback(async () => {
    setBusy(true);
    await fetch(`/api/orders/${orderId}/poll-generation`, { method: "POST" }).catch(() => null);
    router.refresh();
    setBusy(false);
  }, [orderId, router]);

  useEffect(() => {
    if (!canAutoRefresh) return;
    const timer = window.setInterval(() => {
      void refreshProgress();
    }, 20000);
    return () => window.clearInterval(timer);
  }, [canAutoRefresh, refreshProgress]);

  const failed = status === "failed" || status === "generation_failed";

  return (
    <section className="status-progress-panel">
      <div className="status-progress-head">
        <div>
          <h2>生成进度</h2>
          <p>当前阶段：{stageText}</p>
        </div>
        <span>{failed ? "需要处理" : `${progress}%`}</span>
      </div>
      {!failed ? <div className="status-progress-track"><div className="status-progress-fill" style={{ width: `${progress}%` }} /></div> : null}
      {queueText ? <p className="muted">排队提示：{queueText}</p> : null}
      <p className="muted">{helperText}</p>
      <button className="secondary" type="button" onClick={refreshProgress} disabled={busy}>
        <RefreshCw size={18} />{busy ? "刷新中..." : "刷新进度"}
      </button>
    </section>
  );
}
