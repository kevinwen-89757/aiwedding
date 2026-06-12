"use client";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { OrderStatus } from "@/lib/types";

const sellingPoints = [
  "不用早起化妆、不用赶场换衣服，在家就能拍。",
  "不用和摄影师 battle 姿势，AI 懂你的美。",
  "不用花几万块，几百块就能拥有多套风格。",
  "不用担心身材焦虑，AI 精修自然又真实。",
  "不用忍受户外暴晒或寒冷，空调房里就能拍。",
  "不会错过最佳光线，AI 随时都能黄金时刻。",
  "想拍的场景无需舟车劳顿，AI 一键穿越。",
  "不用请假拍婚纱照，下班十分钟搞定。",
  "不用面对镜头尴尬，AI 让你自然又上镜。",
  "不用纠结选片加价，在线自由挑选无套路。",
  "风格不限量，法式、中式、港风随便换。",
  "没有隐形消费，明码标价，选多少付多少。",
];

function useRotatingText(texts: string[], intervalMs = 5000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % texts.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [texts, intervalMs]);
  return texts[index];
}

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
  const sellingPoint = useRotatingText(sellingPoints, 6000);

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
    }, 60000);
    return () => window.clearInterval(timer);
  }, [canAutoRefresh, refreshProgress]);

  const failed = status === "failed" || status === "generation_failed";
  const isGenerating = status === "generating";

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
      {isGenerating ? (
        <p className="muted selling-point">💡 {sellingPoint}</p>
      ) : (
        <>
          {queueText ? <p className="muted">{queueText}</p> : null}
          <p className="muted">{helperText}</p>
        </>
      )}
      <button className="secondary" type="button" onClick={refreshProgress} disabled={busy}>
        <RefreshCw size={18} />{busy ? "刷新中..." : "刷新进度"}
      </button>
    </section>
  );
}
