"use client";
import { CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function MockPayButton({ orderId, kind, label }: { orderId: string; kind: "deposit" | "selection"; label?: string }) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  async function pay() {
    setPaying(true);
    const response = await fetch("/api/payments/mock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId, kind }) });
    setPaying(false);
    if (response.ok) { router.push(kind === "deposit" ? `/orders/${orderId}/status` : `/orders/${orderId}/download`); router.refresh(); }
  }
  return <button onClick={pay} disabled={paying}><CreditCard size={18} />{paying ? "确认中..." : label ?? "已完成付款"}</button>;
}
