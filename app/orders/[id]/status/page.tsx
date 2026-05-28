import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { normalizeStatus } from "@/lib/status";
import { getLocalOrder } from "@/services/localStore";
import { getSelectedThemes } from "@/services/prompts";
type PageProps = { params: Promise<{ id: string }> };
export default async function OrderStatusPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getLocalOrder(id);
  if (!order) return <main className="shell section">订单不存在</main>;
  const selectedThemes = getSelectedThemes(order.selected_theme_ids ?? []);
  const normalized = normalizeStatus(order.status);
  return <main className="narrow section"><div className="card"><p className="eyebrow">Order status</p><h1>你的生成进度</h1><p className="muted">订单号：{order.id}</p><p>当前状态：<StatusBadge status={order.status} /></p><p>已选风格：{order.selected_theme_ids?.length ? selectedThemes.map((theme) => theme.themeName).join("、") : "未选择"}</p>{order.status === "ready_to_generate" ? <div className="card soft"><p>已收到新娘和新郎正脸照，并已确认写真风格。管理员会尽快开始生成。</p></div> : null}{normalized === "generating" ? <div className="card soft"><p>已收到新娘和新郎正脸照，正在生成预览图。</p><p className="muted">系统会根据你选择的风格生成 AI 婚纱写真预览。你可以稍后刷新本页面查看进度。</p></div> : null}{normalized === "generation_failed" ? <div className="error-box">生成暂时失败，请联系客服处理。</div> : null}{normalized === "rejected" ? <div className="error-box"><strong>订单已取消。</strong><br />原因：{order.reject_reason || "订单已取消"}<br />你可以重新上传清晰、无遮挡的单人正脸照片。</div> : null}<div className="actions" style={{marginTop:22}}>{normalized === "pending_payment" ? <Link className="button" href={`/orders/${id}/pay?kind=deposit`}>去支付 9.9 元</Link> : null}{normalized === "pending_theme" ? <Link className="button" href={`/orders/${id}/themes`}>去选风格</Link> : null}{normalized === "pending_selection" || normalized === "pending_final_payment" ? <Link className="button" href={`/orders/${id}/select`}>查看预览并选片</Link> : null}{normalized === "completed" || normalized === "paid" ? <Link className="button" href={`/orders/${id}/download`}>下载无水印原图</Link> : null}{normalized === "rejected" ? <Link className="button" href="/upload">重新上传照片</Link> : null}<Link className="button secondary" href={`/orders/${id}/status`}>刷新状态</Link><Link className="button secondary" href="/">返回首页</Link></div></div></main>;
}
