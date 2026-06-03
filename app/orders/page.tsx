import Link from "next/link";
import { findOrdersByCustomerName } from "@/services/localStore";
import { StatusBadge } from "@/components/StatusBadge";

type PageProps = { searchParams: Promise<{ name?: string; phone?: string }> };

export default async function OrderLookupPage({ searchParams }: PageProps) {
  const { name = "", phone = "" } = await searchParams;
  const nameOrders = name.trim() ? await findOrdersByCustomerName(name.trim()) : [];
  // 双重验证：姓名匹配 + 手机号匹配
  const orders = phone.trim() ? nameOrders.filter((o) => o.customer_phone === phone.trim()) : [];
  const attempted = Boolean(name && phone);

  return (
    <main className="shell section narrow">
      <section className="page-head">
        <p className="eyebrow">My Orders</p>
        <h1>查询我的订单</h1>
        <p className="lead">输入下单时填写的姓名和手机号，验证后即可进入订单。</p>
      </section>

      <form className="form" method="GET" action="/orders">
        <div className="form-row">
          <label>
            <span className="field-label">姓名</span>
            <input name="name" defaultValue={name} placeholder="请输入姓名" required />
          </label>
        </div>
        <div className="form-row">
          <label>
            <span className="field-label">手机号</span>
            <input name="phone" defaultValue={phone} placeholder="请输入手机号" required />
          </label>
        </div>
        <button type="submit">验证并查询</button>
      </form>

      {attempted && orders.length === 0 ? (
        <div className="card" style={{ marginTop: 32 }}>
          <p>未找到匹配的订单。</p>
          <p className="muted">请确认姓名和手机号与下单时填写的一致，或联系工作人员帮助查询。</p>
        </div>
      ) : null}

      {orders.length > 0 ? (
        <section style={{ marginTop: 32 }}>
          <h2>找到 {orders.length} 个订单</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>状态</th>
                  <th>已选风格</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td><StatusBadge status={order.status} /></td>
                    <td>{order.selected_theme_ids?.length ? order.selected_theme_ids.length + " 个风格" : "未选择"}</td>
                    <td>
                      <div className="actions" style={{ gap: 8 }}>
                        <Link className="button secondary" href={`/orders/${order.id}/status`}>查看进度</Link>
                        {order.order_assets.some((a) => a.kind === "generated") ? (
                          <Link className="button secondary" href={`/orders/${order.id}/selection`}>选片</Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="actions" style={{ marginTop: 32 }}>
        <Link className="button secondary" href="/">返回首页</Link>
      </div>
    </main>
  );
}
