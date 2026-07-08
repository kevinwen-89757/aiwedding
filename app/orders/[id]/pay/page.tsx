import Link from "next/link";
import { formatCny } from "@/lib/money";
import { getLocalOrder } from "@/services/localStore";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ kind?: string }> };

export default async function PayPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { kind = "deposit" } = await searchParams;
  const paymentKind = kind === "selection" ? "selection" : "deposit";
  const order = await getLocalOrder(id);
  if (!order) return <main className="shell section">订单不存在</main>;
  const amount = paymentKind === "deposit" ? order.deposit_amount_cents : order.selection_amount_cents;
  const orderShort = id.slice(0, 8);
  const isDeposit = paymentKind === "deposit";

  return (
    <main className="narrow section">
      <div className="card pay-card">
        <p className="eyebrow">Payment</p>
        <h1>{isDeposit ? "支付试看费用" : "支付选片费用"}</h1>
        <p className="amount">应付金额：{formatCny(amount)}</p>

        {isDeposit ? (
          <p className="pay-deduct-hint">
            ¥9.9 试看费可在选购正片时全额抵扣
          </p>
        ) : (
          <div className="pay-breakdown">
            <p className="pay-breakdown-item">正片费用：{formatCny(order.selection_amount_cents)}</p>
            <p className="pay-breakdown-item pay-breakdown-deduct">试看费抵扣：<strong>-{formatCny(order.deposit_amount_cents)}</strong></p>
            <p className="pay-breakdown-total">实付：{formatCny(Math.max(0, order.selection_amount_cents - order.deposit_amount_cents))}</p>
          </div>
        )}

        <div className="pay-qr-wrap">
          <img
            src={isDeposit ? "/wxpay-deposit.jpg" : "/wxpay-selection.jpg"}
            alt="微信支付二维码"
            className="pay-qr-img"
          />
          <p className="pay-qr-hint">
            请扫码支付，并在转账备注中填写订单号后 8 位：<strong>{orderShort}</strong>
          </p>
        </div>

        {isDeposit ? (
          <div className="pay-xhs-notice">
            <p><strong>📕 若从小红书下单：</strong>无需扫码支付，可直接点击下方「我已完成支付」，客服确认后即可继续。如已支付请忽略此提示。</p>
          </div>
        ) : null}

        <div className="actions">
          <Link className="button" href={`/orders/${id}/status`}>我已完成支付</Link>
          <Link className="button secondary" href={`/orders/${id}/status`}>返回订单</Link>
        </div>
      </div>
    </main>
  );
}
