"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteOrderButton({ orderId, orderShort, variant = "row" }: { orderId: string; orderShort: string; variant?: "row" | "detail" }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const name = variant === "detail" ? "该订单" : `订单 ${orderShort}`;
    if (!window.confirm(`确定要删除 ${name} 吗？\n\n删除后无法恢复，请确认这不是真实顾客订单。`)) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        alert("删除失败：" + (body.error || "未知错误"));
        setDeleting(false);
        return;
      }
      if (variant === "detail") {
        router.push("/admin/orders");
      } else {
        router.refresh();
      }
    } catch (err) {
      alert("删除失败：" + (err instanceof Error ? err.message : "网络错误"));
      setDeleting(false);
    }
  }

  if (variant === "row") {
    return (
      <button
        className="button danger"
        onClick={handleDelete}
        disabled={deleting}
        title="删除订单"
        style={{
          background: "transparent",
          color: "#dc2626",
          border: "1px solid #fecaca",
          padding: "4px 8px",
          fontSize: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Trash2 size={14} />
        {deleting ? "删除中…" : "删除"}
      </button>
    );
  }

  return (
    <button
      className="button danger"
      onClick={handleDelete}
      disabled={deleting}
      style={{
        background: "#dc2626",
        color: "#fff",
        border: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Trash2 size={16} />
      {deleting ? "删除中…" : "删除订单"}
    </button>
  );
}
