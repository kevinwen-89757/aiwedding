import Link from "next/link";
import { SelectionGrid } from "@/components/SelectionGrid";
import { SelectionViewTracker } from "@/components/SelectionViewTracker";
import { getLocalOrder } from "@/services/localStore";
import type { OrderAsset } from "@/lib/types";

type PageProps = { params: Promise<{ id: string }> };

export default async function SelectionPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getLocalOrder(id);
  if (!order) return <main className="shell section">订单不存在</main>;
  const generatedAssets = order.order_assets.filter((asset: OrderAsset) => asset.kind === "generated" && asset.generation_type !== "id_photo");
  const idPhotoAssets = order.order_assets.filter((asset: OrderAsset) => asset.kind === "generated" && asset.generation_type === "id_photo");
  return (
    <main className="shell selection-page">
      <SelectionViewTracker orderId={id} />
      <section className="page-head">
        <p className="eyebrow">Selection</p>
        <h1>先看高清预览，再解锁喜欢的原图。</h1>
        <p className="lead">预览高清，选中喜欢的照片后，可解锁无水印原图保存。</p>
        <div className="selection-value-tags">
          <span>高清水印预览</span>
          <span>解锁无水印原图</span>
          <span>无水印保存</span>
        </div>
        <div className="info-box" style={{ marginTop: 16, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#3b82f6" }}>
          <strong>提示：</strong>预览图仅作效果参考，带有水印；付费后获得可商用/可打印的 4K 高清无水印原图。
        </div>
        {/* 24h 保存提示 */}
        <div className="save-24h-hint">
          ⏳ 生成图片仅保存 <strong>24 小时</strong>，请及时选片并下载，避免过期无法查看。
        </div>
      </section>
      {generatedAssets.length === 0 ? (
        <div className="card">
          <p>图片还没有生成完成。</p>
          <Link className="button secondary" href={`/orders/${id}/status`}>返回订单状态</Link>
        </div>
      ) : (
        <SelectionGrid
          orderId={id}
          assets={generatedAssets}
          idPhotoAssets={idPhotoAssets}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hasPriorSelectionPayment={order.payments?.some((p: any) => p.kind === "selection" && p.status === "paid") ?? false}
        />
      )}
    </main>
  );
}
