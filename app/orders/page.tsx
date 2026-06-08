import Link from "next/link";
import { findOrdersByCustomerName } from "@/services/localStore";
import { StatusBadge } from "@/components/StatusBadge";
import { getSelectedThemes } from "@/services/prompts";

type PageProps = { searchParams: Promise<{ name?: string; phone?: string }> };

export default async function OrderLookupPage({ searchParams }: PageProps) {
  const { name = "", phone = "" } = await searchParams;
  const nameOrders = name.trim() ? await findOrdersByCustomerName(name.trim()) : [];
  const orders = phone.trim() ? nameOrders.filter((o) => o.customer_phone === phone.trim()) : [];
  const attempted = Boolean(name && phone);

  function friendlyTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const getThemeNames = (order: typeof orders[number]) =>
    order.selected_theme_ids?.length ? getSelectedThemes(order.selected_theme_ids).map((t) => t.themeName).join("、") : null;

  return (
    <main className="shell section narrow">
      <section className="page-head">
        <p className="eyebrow">My Orders</p>
        <h1>查询我的订单</h1>
        <p className="lead">输入下单时填写的姓名和手机号即可找到你的订单。</p>
      </section>

      <section className="card" style={{ padding: "24px 28px" }}>
        {/* 姓名+手机号同行 */}
        <form className="form" method="GET" action="/orders" id="order-lookup-form" style={{ margin: 0 }}>
          <div className="query-form-row">
            <label>
              <span className="field-label">姓名 <RequiredMark /></span>
              <input
                name="name"
                defaultValue={name}
                placeholder="如：张三"
                pattern="[\u4e00-\u9fa5a-zA-Z\s]+"
                title="姓名只能包含中文或英文字母"
                required
              />
            </label>
            <label>
              <span className="field-label">手机号 <RequiredMark /></span>
              <input
                name="phone"
                defaultValue={phone}
                placeholder="下单时填写的手机号"
                pattern="1[3-9]\d{9}"
                title="请输入11位手机号码"
                inputMode="tel"
                maxLength={11}
                required
              />
            </label>
          </div>
          <button type="submit">验证并查询</button>
        </form>
        {/* Apple 极简校验提示 */}
        <div id="apple-alert-overlay" className="apple-alert-overlay" style={{ display: "none" }}>
          <div className="apple-alert-box">
            <p className="apple-alert-title" id="apple-alert-title"></p>
            <p className="apple-alert-message" id="apple-alert-message"></p>
            <div className="apple-alert-actions">
              <button id="apple-alert-ok">好</button>
            </div>
          </div>
        </div>
        <script>{`(function(){
            var form = document.getElementById("order-lookup-form");
            var overlay = document.getElementById("apple-alert-overlay");
            var titleEl = document.getElementById("apple-alert-title");
            var msgEl = document.getElementById("apple-alert-message");
            var okBtn = document.getElementById("apple-alert-ok");
            function showAlert(title, message) {
              titleEl.textContent = title;
              msgEl.textContent = message;
              overlay.style.display = "flex";
            }
            okBtn.addEventListener("click", function() { overlay.style.display = "none"; });
            overlay.addEventListener("click", function(e) { if (e.target === overlay) overlay.style.display = "none"; });
            form.addEventListener("submit", function(e) {
              var nameVal = form.querySelector('[name="name"]').value.trim();
              var phoneVal = form.querySelector('[name="phone"]').value.trim();
              if (!nameVal) { e.preventDefault(); showAlert("\\u8BF7\\u8F93\\u5165\\u59D3\\u540D", "\\u8BF7\\u586B\\u5199\\u59D3\\u540D\\uFF0C\\u65B9\\u4FBF\\u540E\\u53F0\\u8BC6\\u522B\\u8BA2\\u5355\\u3002"); return; }
              if (!/^[\\u4e00-\\u9fa5a-zA-Z\\s]+$/.test(nameVal)) { e.preventDefault(); showAlert("\\u59D3\\u540D\\u683C\\u5F0F\\u4E0D\\u6B63\\u786E", "\\u59D3\\u540D\\u53EA\\u80FD\\u5305\\u542B\\u4E2D\\u6587\\u6216\\u82F1\\u6587\\u5B57\\u6BCD\\uFF0C\\u4E0D\\u80FD\\u5305\\u542B\\u6570\\u5B57\\u6216\\u7B26\\u53F7\\u3002"); return; }
              if (!phoneVal) { e.preventDefault(); showAlert("\\u8BF7\\u8F93\\u5165\\u624B\\u673A\\u53F7", "\\u8BF7\\u586B\\u5199\\u624B\\u673A\\u53F7\\uFF0C\\u7528\\u4E8E\\u9A8C\\u8BC1\\u67E5\\u8BE2\\u8BA2\\u5355\\u3002"); return; }
              if (!/^1[3-9]\\d{9}$/.test(phoneVal)) { e.preventDefault(); showAlert("\\u624B\\u673A\\u53F7\\u683C\\u5F0F\\u4E0D\\u6B63\\u786E", "\\u8BF7\\u8F93\\u5165\\u6B63\\u786E\\u768411\\u4F4D\\u624B\\u673A\\u53F7\\u7801\\u3002"); return; }
            });
            var nameInput = form.querySelector('[name="name"]');
            var phoneInput = form.querySelector('[name="phone"]');
            nameInput.addEventListener("blur", function() {
              var v = nameInput.value.trim();
              if (v && !/^[\\u4e00-\\u9fa5a-zA-Z\\s]+$/.test(v)) { showAlert("\\u59D3\\u540D\\u683C\\u5F0F\\u4E0D\\u6B63\\u786E", "\\u59D3\\u540D\\u53EA\\u80FD\\u5305\\u542B\\u4E2D\\u6587\\u6216\\u82F1\\u6587\\u5B57\\u6BCD\\u3002"); }
            });
            phoneInput.addEventListener("blur", function() {
              var v = phoneInput.value.trim();
              if (v && !/^1[3-9]\\d{9}$/.test(v)) { showAlert("\\u624B\\u673A\\u53F7\\u683C\\u5F0F\\u4E0D\\u6B63\\u786E", "\\u8BF7\\u8F93\\u5165\\u6B63\\u786E\\u768411\\u4F4D\\u624B\\u673A\\u53F7\\u7801\\u3002"); }
            });
          })();`}</script>
      </section>

      {attempted && orders.length === 0 ? (
        <div className="card" style={{ marginTop: 24, padding: "28px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>未找到匹配的订单</p>
          <p className="muted" style={{ margin: 0 }}>请确认姓名和手机号与下单时填写的一致。</p>
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const hasAssets = order.order_assets.some((a: any) => a.kind === "generated");
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const generatedCount = order.order_assets.filter((a: any) => a.kind === "generated").length;
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
                    </div>
                    {themeNames ? (
                      <p style={{ margin: 0, fontSize: 14, color: "#444" }}>{themeNames}</p>
                    ) : (
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>未选择风格</p>
                    )}
                    <p className="muted" style={{ margin: "6px 0 0", fontSize: 12 }}>
                      创建时间：{friendlyTime(order.created_at)}
                      {hasAssets ? " · 已生成 " + generatedCount + " 张" : ""}
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

function RequiredMark() {
  return <sup className="required-star" aria-hidden="true">*</sup>;
}
