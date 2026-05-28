import Link from "next/link";
import { cookies } from "next/headers";
import { StatusBadge } from "@/components/StatusBadge";
import { isAdminToken } from "@/lib/admin";
import { formatCny } from "@/lib/money";
import { listLocalOrders } from "@/services/localStore";
import { getSelectedThemes } from "@/services/prompts";
type PageProps = { searchParams: Promise<{ token?: string }> };
export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { token = "" } = await searchParams;
  const cookieToken = (await cookies()).get("admin_token")?.value ?? "";
  if (!isAdminToken(token || cookieToken)) return <main className="shell section">无权限访问后台</main>;
  const orders = await listLocalOrders();
  return <main className="shell"><section className="page-head"><p className="eyebrow">Admin</p><h1>订单列表</h1><p className="lead">查看支付、生成、选片和交付状态。</p></section><div className="table-wrap"><table className="table"><thead><tr><th>订单</th><th>客户</th><th>状态</th><th>已选主题</th><th>选片数量</th><th>订单金额</th><th>创建时间</th><th>操作</th></tr></thead><tbody>{orders.map((order)=>{ const themes = order.selected_theme_ids?.length ? getSelectedThemes(order.selected_theme_ids).map((theme)=>theme.themeName).join("、") : "未选择"; return <tr key={order.id}><td>{order.id.slice(0,8)}</td><td>{order.customer_name || order.customer_phone || "未填写"}</td><td><StatusBadge status={order.status} /></td><td>{themes}</td><td>{order.selected_count} 张</td><td>{formatCny(order.selection_amount_cents)}</td><td>{new Date(order.created_at).toLocaleString("zh-CN")}</td><td><Link className="button secondary" href={`/admin/orders/${order.id}`}>查看</Link></td></tr>; })}</tbody></table></div></main>;
}
