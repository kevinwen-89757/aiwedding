import Link from "next/link";
import { SelectionGrid } from "@/components/SelectionGrid";
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
      <section className="page-head">
        <p className="eyebrow">Selection</p>
        <h1>先看高清预览，再解锁喜欢的原图。</h1>
        <p className="lead">预览高清，选中喜欢的照片后，可解锁无水印原图保存。</p>
        <div className="selection-value-tags">
          <span>高清水印预览</span>
          <span>解锁无水印原图</span>
          <span>无水印保存</span>
        </div>
        <div className="info-box" style={{marginTop:16,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"12px 16px",fontSize:14,color:"#dc2626"}}>
          <strong>⚠️ 重要提示：</strong>当前预览图带有<strong>水印</strong>且分辨率仅限屏幕预览，<strong>无法满足大屏显示或打印精度</strong>。付费解锁后可获得<strong>4K 高清无水印原图</strong>，可商用、可打印。
        </div>
      </section>
      {generatedAssets.length === 0 ? (
        <div className="card">
          <p>图片还没有生成完成。</p>
          <Link className="button secondary" href={`/orders/${id}/status`}>返回订单状态</Link>
        </div>
      ) : (
        <SelectionGrid orderId={id} assets={generatedAssets} idPhotoAssets={idPhotoAssets} hasPriorSelectionPayment={order.payments?.some((p) => p.kind === "selection" && p.status === "paid") ?? false} />
      )}
    </main>
  );
}
