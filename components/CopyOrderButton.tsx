"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export function CopyOrderButton({ orderId }: { orderId: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(orderId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }
  return <button className="secondary" onClick={copy} type="button"><Copy size={16} />{copied ? "已复制" : "复制订单号"}</button>;
}
