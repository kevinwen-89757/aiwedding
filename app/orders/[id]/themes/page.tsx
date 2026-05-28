import Link from "next/link";
import { ThemeSelector } from "@/components/ThemeSelector";
import { getLocalOrder } from "@/services/localStore";
import { weddingThemes } from "@/services/prompts";

type PageProps = { params: Promise<{ id: string }> };

export default async function OrderThemesPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getLocalOrder(id);
  if (!order) return <main className="shell section">订单不存在</main>;
  if (order.status === "awaiting_deposit") {
    return <main className="shell section"><div className="card"><h1>选择主题</h1><p className="lead">请先完成 ¥9.9 试看生成支付。</p><Link className="button" href={`/orders/${id}/pay?kind=deposit`}>去支付</Link></div></main>;
  }
  return (
    <main className="shell themes-page">
      <section className="page-head"><p className="eyebrow">Styles</p><h1>选择婚纱写真主题</h1><p className="lead">请选择 1-2 个喜欢的风格。系统会根据你的选择生成 10 张 AI 婚纱写真预览。</p></section>
      <ThemeSelector orderId={id} themes={weddingThemes} selectedThemeIds={order.selected_theme_ids ?? []} />
    </main>
  );
}
