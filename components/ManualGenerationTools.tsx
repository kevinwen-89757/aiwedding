"use client";

import { Clipboard, Upload, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CopyAllPromptsButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return <button className="secondary" type="button" onClick={copy}><Clipboard size={18} />{copied ? "已复制" : "复制全部 Prompt"}</button>;
}

export function ManualGeneratedUploadForm({ orderId, planCount, generatedCount }: { orderId: string; planCount: number; generatedCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/admin/orders/${orderId}/generated-results`, {
      method: "POST",
      body: new FormData(event.currentTarget)
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(body.message ?? (response.ok ? "上传完成，已生成水印预览。" : body.error ?? "上传失败"));
    if (response.ok) router.refresh();
  }
  return (
    <form className="manual-upload" onSubmit={submit}>
      <label>上传生成结果<input name="images" type="file" accept="image/png,image/jpeg,image/webp" multiple required /></label>
      <p className="small">已上传 {generatedCount} 张，计划 {planCount} 张。支持少传或多传。</p>
      {message ? <div className="small">{message}</div> : null}
      <button type="submit" disabled={busy}><Upload size={18} />{busy ? "上传中..." : "上传并生成水印预览"}</button>
    </form>
  );
}

export function CompleteManualGenerationButton({ orderId, disabled }: { orderId: string; disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function complete() {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/admin/orders/${orderId}/complete-generation`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(body.error ?? "操作失败");
      return;
    }
    router.refresh();
  }
  return <div className="manual-complete">{error ? <div className="error-box">{error}</div> : null}<button type="button" onClick={complete} disabled={busy || disabled}><CheckCircle2 size={18} />{busy ? "处理中..." : "完成生成并开放选片"}</button></div>;
}
