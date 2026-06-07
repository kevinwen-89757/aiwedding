"use client";
import { RefreshCw, Rocket, Save, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@/lib/types";
export function AdminOrderActions({ orderId, hasGenerated, status, hasThemes, adminNote: generationNote, updatedAt, hasActiveGenerationTasks }: { orderId: string; hasGenerated: boolean; status: OrderStatus; hasThemes: boolean; adminNote?: string | null; updatedAt?: string; hasActiveGenerationTasks?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [adminNoteValue, setAdminNoteValue] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const hasActiveTask = hasActiveGenerationTasks || Boolean(generationNote?.match(/task_id|任务轮询中|等待后续查询/));
  const isStaleGenerating = status === "generating" && !hasGenerated && updatedAt ? Date.now() - new Date(updatedAt).getTime() > 10 * 60 * 1000 : false;
  const canStartGeneration = status === "ready_to_generate" || status === "generation_failed" || status === "failed" || (status === "generating" && (isStaleGenerating || hasActiveTask));
  const generationButtonText = (() => {
    if (busy === "regenerate" || busy === "start") return "重新生成中...";
    if (hasGenerated) return "重新生成预览";
    if (status === "ready_to_generate") return "开始生成";
    if (status === "generation_failed" || status === "failed") return "重新生成";
    if (status === "generating" && (isStaleGenerating || hasActiveTask)) return "强制重试";
    if (status === "generating") return "生成中…";
    return "开始生成";
  })();
  async function startGeneration(mode: "start" | "regenerate") {
    setBusy(mode); setError("");
    const response = await fetch(`/api/admin/orders/${orderId}/start-generation`, { method: "POST" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (response.status === 409) {
        setError(body.error ?? "当前状态不允许重复启动生成，页面即将刷新…");
        setTimeout(() => router.refresh(), 1500);
      } else {
        setError(body.error ?? "生成失败");
      }
    } else {
      router.refresh();
    }
    setBusy("");
  }
  async function pollGeneration() {
    setBusy("poll"); setError("");
    const response = await fetch(`/api/admin/orders/${orderId}/poll-generation`, { method: "POST" });
    if (!response.ok) { const body = await response.json().catch(() => ({})); setError(body.error ?? "查询生成结果失败"); }
    setBusy(""); router.refresh();
  }
  async function updateStatus(status: string) { setBusy(status); await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, adminNote: adminNoteValue, rejectReason }) }); setBusy(""); router.refresh(); }
  async function confirmPayment(action: "confirm_deposit" | "confirm_selection") { setBusy(action); await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) }); setBusy(""); router.refresh(); }
  async function forceRelease() {
    const ok = confirm("确定要强制上线吗？\n\n这会：\n1. 将订单状态直接改为「等待选片」\n2. 未完成的生成任务将被舍弃\n3. 顾客只能看到已生成的照片\n\n此操作不可撤销。");
    if (!ok) return;
    setBusy("force_release"); setError("");
    const response = await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "force_release" }) });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "强制上线失败");
    } else {
      router.refresh();
    }
    setBusy("");
  }
  return <div className="card"><h2>后台操作</h2>{!hasThemes ? <div className="error-box">当前订单未选择风格，请先让用户选择风格后再生成。</div> : null}<label>管理备注<textarea value={adminNoteValue} onChange={(event)=>setAdminNoteValue(event.target.value)} rows={3} /></label><label>作废原因<textarea value={rejectReason} onChange={(event)=>setRejectReason(event.target.value)} rows={3} /></label>{error ? <div className="error-box">{error}</div> : null}<div className="actions"><button className="secondary" onClick={()=>confirmPayment("confirm_deposit")} disabled={!!busy}><Save size={18} />标记试看费已支付</button><button className="secondary" onClick={()=>confirmPayment("confirm_selection")} disabled={!!busy || !hasGenerated}><Save size={18} />标记选片费已支付</button>{hasActiveTask ? <button className="secondary" onClick={pollGeneration} disabled={!!busy}><RefreshCw size={18} />{busy === "poll" ? "查询中..." : "查询生成结果"}</button> : null}{hasThemes ? <button className="secondary" onClick={()=>startGeneration("regenerate")} disabled={!!busy || !canStartGeneration} title={!canStartGeneration && status === "generating" ? "当前正在生成中，请稍候" : undefined}><RefreshCw size={18} />{generationButtonText}</button> : null}{status === "generating" && (
        <button className="danger" onClick={forceRelease} disabled={!!busy} title="将未完成的生成任务舍弃，直接让顾客进入选片">
          <Rocket size={18} />{busy === "force_release" ? "处理中..." : "强制上线"}
        </button>
      )}
      <button className="danger" onClick={()=>updateStatus("rejected")} disabled={!!busy}><XCircle size={18} />作废订单</button></div></div>;
}
