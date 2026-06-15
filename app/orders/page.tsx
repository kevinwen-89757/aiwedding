import Link from "next/link";
import { findOrdersByCustomerName, listLocalOrders } from "@/services/localStore";
import { OrderLookupForm } from "@/components/OrderLookupForm";
import { StatusBadge } from "@/components/StatusBadge";
import { getSelectedThemes } from "@/services/prompts";

type PageProps = { searchParams: Promise<{ name?: string; phone?: string }> };

export default async function OrderLookupPage({ searchParams }: PageProps) {
  const { name = "", phone = "" } = await searchParams;
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const attempted = Boolean(trimmedName) || Boolean(trimmedPhone);

  let orders: Awaited<ReturnType<typeof listLocalOrders>> = [];
  if (attempted) {
    const nameSet = new Set<string>();
    if (trimmedName) {
      for (const o of await findOrdersByCustomerName(trimmedName)) nameSet.add(o.id);
    }
    if (trimmedPhone) {
      const all = await listLocalOrders();
      for (const o of all) {
        if (o.customer_phone === trimmedPhone) nameSet.add(o.id);
      }
    }
    const allOrders = await listLocalOrders();
    orders = allOrders.filter((o) => nameSet.has(o.id));
  }

  function friendlyTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const getThemeNames = (order: typeof orders[number]) =>
    order.selected_theme_ids?.length ? getSelectedThemes(order.selected_theme_ids).map((t) => t.themeName).join("、") : null;

  return (
    <main className="shell section narrow order-lookup-page">
      <section className="page-head">
        <p className="eyebrow">My Orders</p>
        <h1>查询我的订单</h1>
        <p className="lead">输入下单时填写的姓名或手机号即可找到你的订单。</p>
      </section>

      <section className="card order-lookup-card">
        <OrderLookupForm defaultName={name} defaultPhone={phone} />
      </section>

      {attempted && orders.length === 0 ? (
        <div className="card" style={{ marginTop: 24, padding: "28px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>未找到匹配的订单</p>
          <p className="muted" style={{ margin: 0 }}>请确认姓名或手机号与下单时填写的一致。</p>
          <p className="muted" style={{ margin: "12px 0 0" }}>
            如需帮助，可联系微信客服 <strong>CyberSunset_K</strong>
          </p>
        </div>
      ) : null}

      {orders.length > 0 ? (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            共找到 {orders.length} 个订单
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {orders.map((order) => {
              const themeNames = getThemeNames(order);
              const orderIdShort = order.id.slice(0, 8);
              const hasAssets = order.order_assets.some((a) => a.kind === "generated");
              return (
                <article
                  key={order.id}
                  className="card"
                  style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}
                >
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <StatusBadge status={order.status} />
                      <span className="muted" style={{ fontSize: 13 }}>#{orderIdShort}</span>
                      {order.customer_name ? <span style={{ fontSize: 14, fontWeight: 500 }}>{order.customer_name}</span> : null}
                    </div>
                    {themeNames ? (
                      <p style={{ margin: 0, fontSize: 14, color: "#444" }}>{themeNames}</p>
                    ) : (
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>未选择风格</p>
                    )}
                    <p className="muted" style={{ margin: "6px 0 0", fontSize: 12 }}>
                      创建时间：{friendlyTime(order.created_at)}
                      {hasAssets ? ` · 已生成 ${order.order_assets.filter((a) => a.kind === "generated").length} 张` : ""}
                    </p>
                  </div>
                  <div className="actions" style={{ gap: 8, flexShrink: 0 }}>
                    <Link className="button secondary" href={`/orders/${order.id}/status`}>查看进度</Link>
                    {hasAssets ? (
                      <Link className="button" href={`/orders/${order.id}/selection`}>去选片</Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {!attempted ? (
        <div className="muted" style={{ marginTop: 24, textAlign: "center", fontSize: 13, lineHeight: 1.8 }}>
          <p>提交后即可查看订单进度、选片和支付。</p>
          <p>新客户请 <Link href="/upload" style={{ color: "#1d4ed8" }}>上传照片创建订单</Link></p>
        </div>
      ) : null}

      <div className="actions" style={{ marginTop: 28, justifyContent: "center" }}>
        <Link className="button secondary" href="/">返回首页</Link>
      </div>
    </main>
  );
}
