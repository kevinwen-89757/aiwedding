"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function WeChatPayPanel({
  orderId,
  kind,
  orderShort,
}: {
  orderId: string;
  kind: "deposit" | "selection";
  orderShort: string;
}) {
  const [codeUrl, setCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/payments/wechat/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, kind }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.error) throw new Error(data.error);
        setCodeUrl(data.codeUrl);
        const qr = await QRCode.toDataURL(data.codeUrl, { width: 256, margin: 2 });
        setQrDataUrl(qr);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orderId, kind]);

  useEffect(() => {
    if (!codeUrl || paid) return;
    const interval = setInterval(() => {
      fetch(`/api/orders/${orderId}/wechat-query?kind=${kind}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.paid) {
            setPaid(true);
            clearInterval(interval);
            window.location.href = `/orders/${orderId}/status`;
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [codeUrl, paid, kind, orderId]);

  if (loading) return <p className="muted">正在生成支付二维码...</p>;
  if (error) return <p className="error-text">生成二维码失败：{error}</p>;
  if (paid) return <p>支付成功，正在跳转...</p>;

  return (
    <div>
      <p className="pay-qr-hint">
        请使用微信扫一扫支付<br />
        转账备注请填写订单号后 8 位：<strong>{orderShort}</strong>
      </p>
      {qrDataUrl ? (
        <div className="pay-qr-wrap">
          <img src={qrDataUrl} alt="微信支付二维码" className="pay-qr-img" />
        </div>
      ) : null}
      <p className="muted">支付完成后页面会自动跳转</p>
    </div>
  );
}
