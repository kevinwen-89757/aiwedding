import Link from "next/link";
import { MockPayButton } from "@/components/MockPayButton";
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
  return <main className="narrow section"><div className="card pay-card"><p className="eyebrow">Payment</p><h1>{paymentKind === "deposit" ? "支付试看费用" : "支付选片费用"}</h1><p className="amount">应付金额：{formatCny(amount)}</p><div className="card soft" style={{marginBottom:18}}><h2>微信付款说明</h2><p className="muted">请按页面金额付款，并备注订单号后 8 位：{id.slice(0, 8)}。付款后可联系商家确认，或点击下方按钮继续当前本地流程。</p></div><div className="actions"><MockPayButton orderId={id} kind={paymentKind} label="已完成付款" /><Link className="button secondary" href={`/orders/${id}/status`}>我已付款，等待确认</Link><Link className="button secondary" href={`/orders/${id}/status`}>返回订单</Link></div><p className="small" style={{marginTop:20}}>上线初期可使用扫码付款 + 后台手动确认；后台确认后继续下一步。</p></div></main>;
}
