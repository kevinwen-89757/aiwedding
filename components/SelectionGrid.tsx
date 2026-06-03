"use client";
import { LockKeyhole, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatCny } from "@/lib/money";
import { buildPhotoLayoutRows, fixedAspectRatio, ratioKind } from "@/lib/photoLayout";
import type { OrderAsset } from "@/lib/types";

function previewUrl(asset: OrderAsset) {
  return `/api/download/${asset.id}?preview=1`;
}

export function SelectionGrid({ orderId, assets }: { orderId: string; assets: OrderAsset[] }) {
  const router = useRouter();
  // 按 preview_path 去重，防止同一张图片显示多次
  const uniqueAssets = assets.filter((a, i, arr) => arr.findIndex((x) => x.preview_path === a.preview_path) === i);
  const selectedAssets = uniqueAssets.filter((a) => a.generation_type !== "recommendation");
  const recommendationAssets = uniqueAssets.filter((a) => a.generation_type === "recommendation");
  const [selected, setSelected] = useState(() => new Set(assets.filter((asset) => asset.is_selected).map((asset) => asset.id)));
  const [saving, setSaving] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<OrderAsset | null>(null);
  const [mounted, setMounted] = useState(false);
  const total = useMemo(() => selected.size * 6000, [selected]);
  const rows = useMemo(() => buildPhotoLayoutRows(selectedAssets), [selectedAssets]);
  const recRows = useMemo(() => buildPhotoLayoutRows(recommendationAssets), [recommendationAssets]);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!previewAsset) return;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewAsset(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [previewAsset]);
  function aspectRatioFor(asset: OrderAsset) {
    return fixedAspectRatio(asset) ?? "3 / 4";
  }
  function toggle(assetId: string) {
    const next = new Set(selected);
    if (next.has(assetId)) next.delete(assetId);
    else next.add(assetId);
    setSelected(next);
  }
  function toggleFromKeyboard(event: React.KeyboardEvent<HTMLDivElement>, assetId: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggle(assetId);
  }
  async function submit() {
    setSaving(true);
    const response = await fetch(`/api/orders/${orderId}/selection`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assetIds: Array.from(selected) }) });
    setSaving(false);
    if (response.ok) { router.push(`/orders/${orderId}/pay?kind=selection`); router.refresh(); }
  }
  return <>
    <div className="photo-grid selection-photo-grid">
      {rows.map((row)=>(
        <div className={`selection-row selection-row-${row.kind}`} key={row.id}>
          {row.assets.map((asset)=>(
            <article className={`photo-tile selection-photo-tile selection-photo-tile-${ratioKind(asset)}`} key={asset.id}>
              <div
                className={`selection-preview-frame${selected.has(asset.id) ? " selected" : ""}`}
                style={{ aspectRatio: aspectRatioFor(asset) }}
                role="button"
                tabIndex={0}
                onClick={() => toggle(asset.id)}
                onKeyDown={(event) => toggleFromKeyboard(event, asset.id)}
                aria-pressed={selected.has(asset.id)}
                aria-label={`选择第 ${asset.sort_order} 张`}
              >
                <img src={previewUrl(asset)} alt={`带水印预览图 ${asset.sort_order}`} />
                <span className="selection-hover-hint">{selected.has(asset.id) ? "已选中" : "点击选择这张"}</span>
                <span className="selection-photo-number">#{asset.sort_order}</span>
                <button
                  className={`selection-check-button${selected.has(asset.id) ? " selected" : ""}`}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggle(asset.id);
                  }}
                  aria-pressed={selected.has(asset.id)}
                  aria-label={`选择第 ${asset.sort_order} 张`}
                >
                  {selected.has(asset.id) ? "✓" : ""}
                </button>
                <button
                  className="selection-preview-action"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPreviewAsset(asset);
                  }}
                >
                  预览大图
                </button>
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
    {recRows.length > 0 ? (
      <section className="recommendation-section">
        <div className="recommendation-head">
          <h2>更多风格推荐</h2>
          <p className="muted">以下为其他风格的首图参考，选中后也可加入订单解锁。</p>
        </div>
        <div className="photo-grid recommendation-photo-grid">
          {recRows.map((row) => (
            <div className={`selection-row selection-row-${row.kind}`} key={row.id}>
              {row.assets.map((asset) => (
                <article className={`photo-tile selection-photo-tile selection-photo-tile-${ratioKind(asset)}`} key={asset.id}>
                  <div
                    className={`selection-preview-frame${selected.has(asset.id) ? " selected" : ""}`}
                    style={{ aspectRatio: aspectRatioFor(asset) }}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(asset.id)}
                    onKeyDown={(event) => toggleFromKeyboard(event, asset.id)}
                    aria-pressed={selected.has(asset.id)}
                    aria-label={`选择 ${asset.theme_name ?? "风格"} 首图`}
                  >
                    <img src={previewUrl(asset)} alt={`${asset.theme_name ?? "风格"} 首图`} />
                    <span className="selection-hover-hint">{selected.has(asset.id) ? "已选中" : "点击选择这张"}</span>
                    <span className="selection-photo-number">#{asset.sort_order}</span>
                    <span className="recommendation-theme-label">{asset.theme_name}</span>
                    <button
                      className={`selection-check-button${selected.has(asset.id) ? " selected" : ""}`}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggle(asset.id);
                      }}
                      aria-pressed={selected.has(asset.id)}
                      aria-label={`选择 ${asset.theme_name} 首图`}
                    >
                      {selected.has(asset.id) ? "✓" : ""}
                    </button>
                    <button
                      className="selection-preview-action"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPreviewAsset(asset);
                      }}
                    >
                      预览大图
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </section>
    ) : null}
    <div className="sticky-bar"><strong>{selected.size > 0 ? `已选 ${selected.size} 张` : "请选择喜欢的照片"}</strong><div className="actions"><strong>解锁无水印原图 {formatCny(total)}</strong><button onClick={submit} disabled={saving || selected.size === 0}><LockKeyhole size={18} />{saving ? "保存中..." : selected.size > 0 ? `确认解锁 ${selected.size} 张 · ${formatCny(total)}` : "先选择想解锁的照片"}</button></div></div>
    {mounted && previewAsset ? createPortal((
      <div className="selection-lightbox" role="dialog" aria-modal="true" aria-label={`第 ${previewAsset.sort_order} 张带水印预览图`} onClick={() => setPreviewAsset(null)}>
        <button className="selection-lightbox-close" type="button" onClick={() => setPreviewAsset(null)} aria-label="关闭预览"><X size={22} /></button>
        <div className="selection-lightbox-content" onClick={(event) => event.stopPropagation()}>
          <p>#{previewAsset.sort_order} 高清水印预览 · 解锁后即可下载无水印原图</p>
          <img src={previewUrl(previewAsset)} alt={`带水印大图预览 ${previewAsset.sort_order}`} />
        </div>
      </div>
    ), document.body) : null}
  </>;
}
