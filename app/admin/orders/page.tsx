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
  const waitingOrders = orders.filter((o) => o.status === "ready_to_generate").sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const generatingOrders = orders.filter((o) => o.status === "generating");
  const failedOrders = orders.filter((o) => o.status === "generation_failed");
  const queueSummary = (
    <section className="queue-summary" style={{ marginBottom: 32, padding: "16px 20px", background: "#f8f6f3", borderRadius: 12, border: "1px solid #e8e3dc" }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>🔄 生成队列</h2>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#666" }}>待开始生成</p>
          <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: waitingOrders.length > 0 ? "#d97706" : "#059669" }}>{waitingOrders.length}</p>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#666" }}>正在生成中</p>
          <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: "#2563eb" }}>{generatingOrders.length}</p>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#666" }}>生成异常</p>
          <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: failedOrders.length > 0 ? "#dc2626" : "#666" }}>{failedOrders.length}</p>
        </div>
      </div>
      {waitingOrders.length > 0 && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef3c7", borderRadius: 8, fontSize: 13 }}>
          <p style={{ margin: 0, fontWeight: 600, marginBottom: 6 }}>⏳ 排队等待生成：</p>
          {waitingOrders.slice(0, 5).map((o, i) => (
            <p key={o.id} style={{ margin: "2px 0", fontFamily: "monospace" }}>
              #{i + 1} <Link href={`/admin/orders/${o.id}`} style={{ color: "#1d4ed8" }}>{o.id.slice(0, 8)}</Link>
              {" — "}{o.customer_name || o.customer_phone || "未填写"}
              {" — "}等待管理员开始生成
            </p>
          ))}
        </div>
      )}
      {generatingOrders.length > 0 && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#dbeafe", borderRadius: 8, fontSize: 13 }}>
          <p style={{ margin: 0, fontWeight: 600, marginBottom: 6 }}>⚙️ 正在生成的订单：</p>
          {generatingOrders.slice(0, 5).map((o) => (
            <p key={o.id} style={{ margin: "2px 0", fontFamily: "monospace" }}>
              <Link href={`/admin/orders/${o.id}`} style={{ color: "#1d4ed8" }}>{o.id.slice(0, 8)}</Link>
              {" — "}{o.generation_jobs?.filter((j) => j.status === "completed").length || 0}/{o.generation_jobs?.length || "?"} 张已完成
            </p>
          ))}
        </div>
      )}
      {failedOrders.length > 0 && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#fee2e2", borderRadius: 8, fontSize: 13 }}>
          <p style={{ margin: 0, fontWeight: 600, marginBottom: 6 }}>❌ 生成异常的订单：</p>
          {failedOrders.slice(0, 5).map((o) => (
            <p key={o.id} style={{ margin: "2px 0", fontFamily: "monospace" }}>
              <Link href={`/admin/orders/${o.id}`} style={{ color: "#dc2626" }}>{o.id.slice(0, 8)}</Link>
              {" — "}{o.customer_name || o.customer_phone || "未填写"}
            </p>
          ))}
        </div>
      )}
    </section>
  );
  return <main className="shell"><section className="page-head"><p className="eyebrow">Admin</p><h1>订单列表</h1><p className="lead">查看支付、生成、选片和交付状态。</p></section>{queueSummary}<div className="table-wrap"><table className="table"><thead><tr><th>订单</th><th>客户</th><th>状态</th><th>已选主题</th><th>选片数量</th><th>订单金额</th><th>创建时间</th><th>操作</th></tr></thead><tbody>{orders.map((order)=>{ const themes = order.selected_theme_ids?.length ? getSelectedThemes(order.selected_theme_ids).map((theme)=>theme.themeName).join("、") : "未选择"; return <tr key={order.id}><td>{order.id.slice(0,8)}</td><td>{order.customer_name || order.customer_phone || "未填写"}</td><td><StatusBadge status={order.status} /></td><td>{themes}</td><td>{order.selected_count} 张</td><td>{formatCny(order.selection_amount_cents)}</td><td>{new Date(order.created_at).toLocaleString("zh-CN")}</td><td><Link className="button secondary" href={`/admin/orders/${order.id}`}>查看</Link></td></tr>; })}</tbody></table></div></main>;
}
