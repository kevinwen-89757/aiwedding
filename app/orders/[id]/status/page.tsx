import Link from "next/link";
import { OrderStatusProgress } from "@/components/OrderStatusProgress";
import { StatusBadge } from "@/components/StatusBadge";
import { normalizeStatus } from "@/lib/status";
import { getLocalOrder } from "@/services/localStore";
import { getSelectedThemes } from "@/services/prompts";
type PageProps = { params: Promise<{ id: string }> };

function progressInfo(order: Awaited<ReturnType<typeof getLocalOrder>>, normalized: string) {
  if (!order) return { progress: 0, stageText: "订单不存在", helperText: "", queueText: "", canAutoRefresh: false };
  const generatedCount = order.order_assets.filter((asset) => asset.kind === "generated").length;
  const hasTaskId = Boolean(order.generation_jobs?.some((job) => job.task_id));
  if (normalized === "generation_failed") return { progress: 0, stageText: "生成遇到问题，管理员会重新处理", helperText: "请稍后查看，或联系工作人员确认处理进度。", queueText: "", canAutoRefresh: false };
  if (normalized === "completed" || normalized === "paid") return { progress: 100, stageText: "订单已完成，所有图片已生成", helperText: "可下载无水印原图，如有问题请联系工作人员。", queueText: "", canAutoRefresh: false };
  if (normalized === "pending_selection") return { progress: 100, stageText: "预览图已生成，可以开始选片", helperText: "预览图已生成，可以开始选片。", queueText: "", canAutoRefresh: false };
  if (normalized === "generating") {
    if (generatedCount > 0) return { progress: Math.min(90, 80 + generatedCount), stageText: "已生成部分预览图，剩余图片还在处理中", helperText: `目前已生成 ${generatedCount} 张预览图，页面会自动刷新进度。`, queueText: "剩余任务会继续自动查询，不需要重复提交订单。", canAutoRefresh: true };
    if (hasTaskId) return { progress: 65, stageText: "已进入 AI 生成队列，正在生成高清婚纱写真预览", helperText: "AI 正在生成高清婚纱写真预览，当前预计生成 5 张样片。预计需要 2-5 分钟；如果同时生成订单较多，可能会略有延迟。", queueText: "AI 生成通常需要几分钟，请保持页面或稍后回来查看。", canAutoRefresh: true };
    return { progress: 45, stageText: "正在排队，等待进入 AI 生成队列", helperText: "已收到照片和风格，系统会按顺序处理生成任务。", queueText: "如果当前同时生成的人较多，等待时间会略有增加。", canAutoRefresh: true };
  }
  if (order.status === "ready_to_generate") return { progress: 35, stageText: "已收到照片和风格，正在等待管理员开始生成", helperText: "我们会根据你选择的风格生成 AI 婚纱写真预览。", queueText: "前方可能还有其他订单，系统会按顺序处理。", canAutoRefresh: true };
  if (normalized === "pending_theme") return { progress: 10, stageText: "已上传照片，请选择喜欢的风格", helperText: "选择 1-2 个风格后，即可支付试看费。", queueText: "", canAutoRefresh: false };
  if (normalized === "pending_payment") return { progress: 25, stageText: "已选择风格，请支付试看费", helperText: "试看费可抵扣正片费用，支付后即可开始生成。", queueText: "", canAutoRefresh: false };
  return { progress: 20, stageText: "订单已创建", helperText: "请按页面提示完成下一步。", queueText: "", canAutoRefresh: false };
}

export default async function OrderStatusPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getLocalOrder(id);
  if (!order) return <main className="shell section">订单不存在</main>;
  const selectedThemes = getSelectedThemes(order.selected_theme_ids ?? []);
  const normalized = normalizeStatus(order.status);
  const info = progressInfo(order, normalized);
  return <main className="narrow section"><div className="card"><p className="eyebrow">Order status</p><h1>你的生成进度</h1><p className="muted">订单号：{order.id}</p><p>当前状态：<StatusBadge status={order.status} /></p><p>已选风格：{order.selected_theme_ids?.length ? selectedThemes.map((theme) => theme.themeName).join("、") : "未选择"}</p><OrderStatusProgress orderId={order.id} status={order.status} progress={info.progress} stageText={info.stageText} helperText={info.helperText} queueText={info.queueText} canAutoRefresh={info.canAutoRefresh} />{normalized === "generation_failed" ? <div className="error-box">生成遇到问题，管理员会重新处理。</div> : null}{normalized === "rejected" ? <div className="error-box"><strong>订单已取消。</strong><br />原因：{order.reject_reason || "订单已取消"}<br />你可以重新上传清晰、无遮挡的单人正脸照片。</div> : null}<div className="actions" style={{marginTop:22}}>{normalized === "pending_theme" ? <Link className="button" href={`/orders/${id}/themes`}>去选风格</Link> : null}{normalized === "pending_payment" ? <Link className="button" href={`/orders/${id}/pay?kind=deposit`}>去支付试看费</Link> : null}{normalized === "pending_selection" || normalized === "pending_final_payment" ? <Link className="button" href={`/orders/${id}/select`}>查看预览图</Link> : null}{normalized === "completed" || normalized === "paid" ? <Link className="button" href={`/orders/${id}/download`}>下载无水印原图</Link> : null}{normalized === "rejected" ? <Link className="button" href="/upload">重新上传照片</Link> : null}<Link className="button secondary" href={`/orders/${id}/status`}>刷新状态</Link><Link className="button secondary" href="/">返回首页</Link></div></div></main>;
}
