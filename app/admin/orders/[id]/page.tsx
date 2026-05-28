import Link from "next/link";
import { cookies } from "next/headers";
import { AdminOrderActions } from "@/components/AdminOrderActions";
import { CopyOrderButton } from "@/components/CopyOrderButton";
import { CompleteManualGenerationButton, CopyAllPromptsButton, ManualGeneratedUploadForm } from "@/components/ManualGenerationTools";
import { StatusBadge } from "@/components/StatusBadge";
import { isAdminToken } from "@/lib/admin";
import { appConfig } from "@/lib/config";
import { formatCny } from "@/lib/money";
import { getProgressIndex } from "@/lib/status";
import type { OrderAsset } from "@/lib/types";
import { formatGenerationPrompts, generationTypeLabel, getOrderGenerationPlan, getReferenceUploadAssets } from "@/services/generation";
import { getLocalOrder } from "@/services/localStore";
import { getSelectedThemes } from "@/services/prompts";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> };

function generationTypeText(type: OrderAsset["generation_type"]) {
  return generationTypeLabel(type);
}

function UploadReference({ title, asset }: { title: string; asset: OrderAsset | null }) {
  return (
    <div>
      <h3>{title}</h3>
      {asset ? <img className="upload-preview" src={`/api/download/${asset.id}`} alt={title} /> : <p className="muted">未上传</p>}
    </div>
  );
}

export default async function AdminOrderDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token = "" } = await searchParams;
  const cookieToken = (await cookies()).get("admin_token")?.value ?? "";
  if (!isAdminToken(token || cookieToken)) return <main className="shell section">无权限访问后台</main>;

  const order = await getLocalOrder(id);
  if (!order) return <main className="shell section">订单不存在</main>;

  const references = getReferenceUploadAssets(order);
  const upload = references.primary;
  const generated = order.order_assets.filter((asset: OrderAsset) => asset.kind === "generated");
  const selectedThemes = getSelectedThemes(order.selected_theme_ids ?? []);
  const themeText = order.selected_theme_ids?.length ? selectedThemes.map((theme) => theme.themeName).join("、") : "未选择";
  const generationPlan = order.selected_theme_ids?.length ? getOrderGenerationPlan(order) : [];
  const promptText = formatGenerationPrompts(order, upload);
  const progress = getProgressIndex(order.status);
  const steps = ["上传", "支付9.9", "选主题", "生成", "选片", "付款", "下载"];
  const isApiMode = appConfig.generationMode === "api";

  return (
    <main className="shell">
      <section className="page-head">
        <div className="actions" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="eyebrow">Admin detail</p>
            <h1>订单详情</h1>
            <p className="muted">完整订单号：{order.id}</p>
          </div>
          <Link className="button secondary" href="/admin/orders">返回列表</Link>
        </div>
        <div className="progress progress-compact">
          {steps.map((step, index) => <span className={`progress-step ${index <= progress ? "done" : ""} ${index === progress ? "active" : ""}`} key={step}>{step}</span>)}
        </div>
        <div className="actions">
          <Link className="button secondary" href={`/orders/${order.id}/status`}>打开用户状态页</Link>
          <Link className="button secondary" href={`/orders/${order.id}/select`}>打开用户选片页</Link>
          <Link className="button secondary" href={`/orders/${order.id}/download`}>打开下载页</Link>
          <CopyOrderButton orderId={order.id} />
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h2>订单信息</h2>
          <p>状态：<StatusBadge status={order.status} /></p>
          <p>客户：{order.customer_name || "未填写"}</p>
          <p>手机：{order.customer_phone || "未填写"}</p>
          <p>邮箱：{order.customer_email || "未填写"}</p>
          <p>已选主题：{themeText}</p>
          <p>新娘照：{references.bride ? "已上传" : "未上传"}</p>
          <p>新郎照：{references.groom ? "已上传" : "未上传"}</p>
          <p>选片数量：{order.selected_count} 张</p>
          <p>选片金额：{formatCny(order.selection_amount_cents)}</p>
          {order.admin_note ? <details><summary>生成/管理记录</summary><pre>{order.admin_note}</pre></details> : null}
        </div>

        <div className="card">
          <h2>上传照片</h2>
          <div className="upload-reference-grid">
            <UploadReference title="新娘正脸照" asset={references.bride} />
            <UploadReference title="新郎正脸照" asset={references.groom} />
          </div>
        </div>

        <AdminOrderActions orderId={order.id} hasGenerated={generated.length > 0} status={order.status} hasThemes={Boolean(order.selected_theme_ids?.length)} adminNote={order.admin_note} updatedAt={order.updated_at} />
      </section>

      {generationPlan.length > 0 ? (
        <section className="section manual-task">
          <div className="card">
            <div className="manual-head">
              <div>
                <h2>{isApiMode ? "API 生成任务" : "人工生成任务包"}</h2>
                <p className="muted">当前模式：{appConfig.generationMode}。Provider：{appConfig.generationProvider ?? "未配置"}。模型：{appConfig.apimartModel}。测试限制：{appConfig.generationTestLimit ?? "未设置"}。normal 为常规预览图，共 10 张；sweet_spot 为内部甜点首图，用户端不显示这个概念。</p>
              </div>
              <div className="actions">
                {upload ? <a className="button secondary" href={`/api/download/${upload.id}`} download>下载用户上传原图</a> : null}
                <CopyAllPromptsButton text={promptText} />
                {isApiMode ? <details><summary className="button secondary">备用任务包</summary><a className="button secondary" href={`/api/admin/orders/${order.id}/task-prompts`}>下载任务包</a></details> : <a className="button secondary" href={`/api/admin/orders/${order.id}/task-prompts`}>下载任务包</a>}
              </div>
            </div>
            <div className="manual-layout">
              <div>
                <div className="upload-reference-grid">
                  <UploadReference title="新娘正脸照" asset={references.bride} />
                  <UploadReference title="新郎正脸照" asset={references.groom} />
                </div>
                <h3>已选风格</h3>
                <p className="muted">{themeText}</p>
                {isApiMode ? null : <><ManualGeneratedUploadForm orderId={order.id} planCount={generationPlan.length} generatedCount={generated.length} /><CompleteManualGenerationButton orderId={order.id} disabled={generated.length < 1} /></>}
              </div>
              <div className="table-wrap manual-table">
                <table className="table">
                  <thead><tr><th>编号</th><th>类型</th><th>主题</th><th>Prompt</th><th>画幅</th><th>内容</th></tr></thead>
                  <tbody>
                    {generationPlan.map((item) => (
                      <tr key={item.imageNumber}>
                        <td>图 {item.imageNumber}</td>
                        <td>{generationTypeLabel(item.generationType)}</td>
                        <td>{item.themeName}</td>
                        <td>{item.promptName}</td>
                        <td>{item.aspectRatio}</td>
                        <td><details><summary>查看 prompt</summary><pre>{item.rawPrompt}</pre></details></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <h2>生成结果</h2>
        {generated.length === 0 ? <div className="card">暂无生成图</div> : (
          <div className="photo-grid">
            {generated.map((asset: OrderAsset) => (
              <article className="photo-tile" key={asset.id}>
                <img src={`/api/download/${asset.id}?preview=1`} alt={`生成图 ${asset.sort_order}`} />
                <div className="tile-footer"><span>#{asset.sort_order}</span><span>{asset.is_selected ? "已选" : "未选"}</span></div>
                <div className="asset-meta">
                  <div>{asset.theme_name ?? "未记录主题"}</div>
                  <div>{asset.prompt_name ?? "未记录 prompt"}</div>
                  <div>{asset.aspect_ratio ?? "未记录比例"}</div>
                  <div>{generationTypeText(asset.generation_type)}</div>
                  {asset.generation_provider ? <div>{asset.generation_provider} / {asset.generation_model ?? "未记录模型"}</div> : null}
                  {asset.generation_task_id ? <div>task_id: {asset.generation_task_id}</div> : null}
                  {asset.generation_status ? <div>状态: {asset.generation_status}</div> : null}
                  {asset.generation_error ? <div>错误: {asset.generation_error}</div> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
