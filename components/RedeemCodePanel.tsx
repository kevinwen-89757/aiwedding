"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function RedeemCodePanel({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleRedeem() {
    const trimmed = code.trim();
    if (!trimmed) {
      setMsg({ text: "请输入兑换码", ok: false });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: trimmed, orderId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMsg({ text: "✅ " + (data.message ?? "兑换成功！正在准备生成照片…"), ok: true });
        // 兑换成功后跳转到订单状态页（自动开始生成）
        setTimeout(() => {
          router.push(data.redirectTo ?? `/orders/${orderId}/status`);
        }, 1500);
      } else {
        setMsg({ text: data.error ?? "兑换失败", ok: false });
      }
    } catch {
      setMsg({ text: "网络错误，请稍后重试", ok: false });
    }
    setBusy(false);
  }

  return (
    <div className="redeem-code-panel">
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>📕 小红书兑换码</h3>
      <p style={{ fontSize: 13, color: "#666", margin: "0 0 10px", lineHeight: 1.5 }}>
        若你从小红书购买了兑换码，输入 7 位数字码即可直接开始生成照片，无需支付试看费用。
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 7))}
          placeholder="输入 7 位兑换码"
          maxLength={7}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #d4c8a8",
            fontSize: 18,
            fontFamily: '"SF Mono", "Menlo", monospace',
            letterSpacing: "0.15em",
            textAlign: "center",
            background: "#fffcf0",
            outline: "none",
          }}
          onFocus={(e) => { e.target.style.borderColor = "#c4a85e"; }}
          onBlur={(e) => { e.target.style.borderColor = "#d4c8a8"; }}
        />
        <button
          onClick={handleRedeem}
          disabled={busy || code.length !== 7}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: busy || code.length !== 7 ? "#ccc" : "#c4a85e",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: busy || code.length !== 7 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >{busy ? "校验中…" : "兑换"}</button>
      </div>
      {msg ? (
        <p style={{
          margin: "8px 0 0",
          fontSize: 13,
          color: msg.ok ? "#166534" : "#dc2626",
          fontWeight: 500,
        }}>{msg.text}</p>
      ) : null}
    </div>
  );
}
