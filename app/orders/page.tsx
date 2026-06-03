import Link from "next/link";
import { findOrdersByCustomerName } from "@/services/localStore";
import { StatusBadge } from "@/components/StatusBadge";

type PageProps = { searchParams: Promise<{ name?: string }> };

export default async function OrderLookupPage({ searchParams }: PageProps) {
  const { name = "" } = await searchParams;
  const orders = name.trim() ? await findOrdersByCustomerName(name.trim()) : [];

  return (
    <main className="shell section narrow">
      <section className="page-head">
        <p className="eyebrow">My Orders</p>
        <h1>查询我的订单</h1>
        <p className="lead">输入下单时填写的姓名，即可找到你的订单。</p>
      </section>

      <form className="form" method="GET" action="/orders">
        <div className="form-row">
          <label>
            <span className="field-label">你的姓名</span>
            <input name="name" defaultValue={name} placeholder="请输入姓名" required />
          </label>
        </div>
        <button type="submit">查询订单</button>
      </form>

      {name && orders.length === 0 ? (
        <div className="card" style={{ marginTop: 32 }}>
          <p>未找到与 &ldquo;{name}&rdquo; 相关的订单。</p>
          <p className="muted">请确认姓名是否正确，或联系工作人员帮助查询。</p>
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
