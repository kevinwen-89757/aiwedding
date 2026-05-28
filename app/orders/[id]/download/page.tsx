import Link from "next/link";
import { DownloadGrid } from "@/components/DownloadGrid";
import { getLocalOrder } from "@/services/localStore";
import type { OrderAsset } from "@/lib/types";
type PageProps = { params: Promise<{ id: string }> };
export default async function DownloadPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getLocalOrder(id);
  if (!order) return <main className="shell section">订单不存在</main>;
  const unlocked = order.order_assets.filter((asset: OrderAsset) => asset.kind === "generated" && asset.is_selected && asset.is_unlocked);
  return <main className="shell download-page"><section className="page-head"><p className="eyebrow">Download</p><h1>下载无水印原图。</h1><p className="lead">已解锁无水印原图，请尽快保存。</p></section><div className="card" style={{marginBottom:32}}><h2>交付说明</h2><p className="muted">图片为 AI 生成写真图，适合朋友圈、头像、小红书、纪念照等场景。</p></div>{unlocked.length === 0 ? <div className="card"><p>暂无可下载原图，请先完成选片支付。</p><Link className="button" href={`/orders/${id}/select`}>返回选片</Link></div> : <DownloadGrid assets={unlocked} />}</main>;
}
