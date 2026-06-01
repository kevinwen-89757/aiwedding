import Link from "next/link";
import { cookies } from "next/headers";
import { AdminConfirmButtons } from "@/components/AdminConfirmButtons";
import { CopyOrderButton } from "@/components/CopyOrderButton";
import { StatusBadge } from "@/components/StatusBadge";
import { isAdminToken } from "@/lib/admin";
import { formatCny } from "@/lib/money";
import { getProgressIndex } from "@/lib/status";
import type { OrderAsset } from "@/lib/types";
import {
  generationTypeLabel,
  getEffectiveOrderGenerationPlan,
  getGenerationRuntimeConfig,
  getReferenceUploadAssets,
} from "@/services/generation";
import { getLocalOrder } from "@/services/localStore";
import { getSelectedThemes } from "@/services/prompts";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> };

function UploadReference({ title, asset }: { title: string; asset: OrderAsset | null }) {
  return (
    <div>
      <h3>{title}</h3>
      {asset ? (
        <img className="upload-preview" src={`/api/download/${asset.id}`} alt={title} />
      ) : (
        <p className="muted">未上传</p>
      )}
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
  const generated = order.order_assets.filter((asset: OrderAsset) => asset.kind === "generated");
  const generationJobs = order.generation_jobs ?? [];
  const generatedAssetsCount = generated.length;
  const activeGenerationJobs = generationJobs.filter((job) => job.status !== "completed" && job.status !== "failed");
  const selectedThemes = getSelectedThemes(order.selected_theme_ids ?? []);
  const themeText = order.selected_theme_ids?.length ? selectedThemes.map((theme) => theme.themeName).join("、") : "未选择";
  const generationPlan = order.selected_theme_ids?.length ? getEffectiveOrderGenerationPlan(order) : [];
  const progress = getProgressIndex(order.status);
  const steps = ["上传", "选主题", "支付", "生成", "选片", "付款", "下载"];

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
          {steps.map((step, index) => (
            <span className={`progress-step ${index <= progress ? "done" : ""} ${index === progress ? "active" : ""}`} key={step}>
              {step}
            </span>
          ))}
        </div>
        <div className="actions">
          <Link className="button secondary" href={`/orders/${id}/status`}>用户状态页</Link>
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
          <p>选片数量：{order.selected_count} 张</p>
          <p>选片金额：{formatCny(order.selection_amount_cents)}</p>
          {order.admin_note ? (
            <details>
              <summary>生成/管理记录</summary>
              <pre>{order.admin_note}</pre>
            </details>
          ) : null}
          <AdminConfirmButtons orderId={order.id} status={order.status} />
        </div>

        <div className="card">
          <h2>上传照片</h2>
          <div className="upload-reference-grid">
            <UploadReference title="新娘正脸照" asset={references.bride} />
            <UploadReference title="新郎正脸照" asset={references.groom} />
          </div>
        </div>

        <div className="card">
          <h2>生成状态</h2>
          <p>模式：API 自动 / 人工</p>
          <p>计划：{generationPlan.length} 张</p>
          <p>已完成：{generatedAssetsCount} 张</p>
          <p>进行中：{activeGenerationJobs.length} 张</p>
          {generationJobs.length > 0 && (
            <details>
              <summary>APIMart 任务详情</summary>
              {generationJobs.map((job) => (
                <p key={job.task_id || job.image_number} className="muted">
                  图 {job.image_number}：{job.status} · 查询 {job.poll_count} 次{job.error ? ` · ${job.error}` : ""}
                </p>
              ))}
            </details>
          )}
        </div>
      </section>

      <section className="section">
        <h2>生成结果</h2>
        {generated.length === 0 ? (
          <div className="card">暂无生成图</div>
        ) : (
          <div className="photo-grid">
            {generated.map((asset: OrderAsset) => (
              <article className="photo-tile" key={asset.id}>
                <img src={`/api/download/${asset.id}?preview=1`} alt={`生成图 ${asset.sort_order}`} />
                <div className="tile-footer">
                  <span>#{asset.sort_order}</span>
                  <span>{asset.is_selected ? "已选" : "未选"}</span>
                </div>
                <div className="asset-meta">
                  <div>{asset.theme_name ?? "未记录主题"}</div>
                  <div>{asset.prompt_name ?? "未记录 prompt"}</div>
                  <div>{generationTypeLabel(asset.generation_type)}</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
