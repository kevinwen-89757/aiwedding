"use client";
import { LockKeyhole, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatCny } from "@/lib/money";
import { buildPhotoLayoutRows, fixedAspectRatio, ratioKind } from "@/lib/photoLayout";
import type { OrderAsset } from "@/lib/types";

function previewUrl(asset: OrderAsset) {
  // 显示 4K 高清原图预览（无水印），但防下载 — 截图清晰度不够打印精度
  return `/api/download/${asset.id}?show4k=1`;
}

function preventDownload(event: React.MouseEvent | React.DragEvent) {
  event.preventDefault();
}

type ThemeGroup = { themeId: string; themeName: string; assets: OrderAsset[] };

function groupByTheme(assets: OrderAsset[]): ThemeGroup[] {
  const map = new Map<string, ThemeGroup>();
  for (const a of assets) {
    const key = a.theme_id ?? "unknown";
    if (!map.has(key)) map.set(key, { themeId: key, themeName: a.theme_name ?? "其他", assets: [] });
    map.get(key)!.assets.push(a);
  }
  return Array.from(map.values());
}

function AssetTile({ asset, selected, isUnlocked, onToggle, onPreview }: { asset: OrderAsset; selected: boolean; isUnlocked: boolean; onToggle: () => void; onPreview: () => void }) {
  return (
    <article className={`photo-tile selection-photo-tile selection-photo-tile-${ratioKind(asset)}`}>
      <div
        className={`selection-preview-frame${selected ? " selected" : ""}`}
        style={{ aspectRatio: fixedAspectRatio(asset) ?? "3 / 4" }}
        role="button"
        tabIndex={0}
        onClick={isUnlocked ? undefined : onToggle}
        onKeyDown={(event) => { if (!isUnlocked && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onToggle(); } }}
        aria-pressed={selected}
        aria-label={`选择第 ${asset.sort_order} 张`}
      >
        <img src={previewUrl(asset)} alt={`带水印预览图 ${asset.sort_order}`} onContextMenu={preventDownload} onDragStart={preventDownload} style={{userSelect:"none",pointerEvents:"none"}} />
        {/* 透明覆盖层 — 防止拖拽图片到桌面/另存为 */}
        <div style={{position:"absolute",inset:0,zIndex:1,cursor:"pointer"}} onClick={isUnlocked ? undefined : onToggle} />
        {isUnlocked ? (
          <span className="selection-unlocked-badge">已解锁</span>
        ) : (
          <>
            <span className="selection-hover-hint">{selected ? "已选中" : "解锁高清无水印"}</span>
            <button
              className={`selection-check-button${selected ? " selected" : ""}`}
              type="button"
              onClick={(event) => { event.stopPropagation(); onToggle(); }}
              aria-pressed={selected}
              aria-label={`选择第 ${asset.sort_order} 张`}
            >{selected ? "✓" : ""}</button>
          </>
        )}
        <span className="selection-photo-number">#{asset.sort_order}</span>
        <button className="selection-preview-action" type="button" onClick={(event) => { event.stopPropagation(); onPreview(); }}>预览大图</button>
      </div>
    </article>
  );
}

export function SelectionGrid({ orderId, assets, idPhotoAssets, hasPriorSelectionPayment }: { orderId: string; assets: OrderAsset[]; idPhotoAssets?: OrderAsset[]; hasPriorSelectionPayment?: boolean }) {
  const router = useRouter();
  const uniqueAssets = assets.filter((a, i, arr) => arr.findIndex((x) => x.preview_path === a.preview_path) === i);
  const selectedAssets = uniqueAssets.filter((a) => a.generation_type !== "recommendation");
  const recommendationAssets = uniqueAssets.filter((a) => a.generation_type === "recommendation");
  const [selected, setSelected] = useState(() => new Set(assets.filter((asset) => asset.is_selected).map((asset) => asset.id)));
  const [saving, setSaving] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<OrderAsset | null>(null);
  const [mounted, setMounted] = useState(false);
  const [idPhotos, setIdPhotos] = useState<OrderAsset[]>(idPhotoAssets ?? []);
  const [idPhotoPolling, setIdPhotoPolling] = useState(false);
  const [idPhotoMessage, setIdPhotoMessage] = useState("");
  const unlockedCount = useMemo(() => Array.from(selected).filter((id) => assets.find((a) => a.id === id)?.is_unlocked).length, [selected, assets]);
  const newCount = selected.size - unlockedCount;
  const totalFreeCount = useMemo(() => Math.floor(selected.size / 10), [selected]);
  const oldFreeCount = useMemo(() => Math.floor(unlockedCount / 10), [unlockedCount]);
  const newFreeCount = totalFreeCount - oldFreeCount;
  const payableCount = Math.max(0, newCount - newFreeCount);
  const payableAmount = payableCount * 5990;
  const canUseDepositDeduct = !hasPriorSelectionPayment;
  const depositDeduct = canUseDepositDeduct ? 990 : 0; // ¥9.9 试看费仅首次选片可抵扣
  const finalAmount = Math.max(0, payableAmount - depositDeduct);
  const themeGroups = useMemo(() => groupByTheme(selectedAssets), [selectedAssets]);
  const recRows = useMemo(() => buildPhotoLayoutRows(recommendationAssets), [recommendationAssets]);
  const promoRemaining = Math.max(0, 10 - (selected.size % 10));
  const hasAnyUnlocked = assets.some((a) => a.is_unlocked);
  useEffect(() => { setMounted(true); }, []);

  // Poll ID photo generation status
  useEffect(() => {
    if (!idPhotoAssets?.length) return;
    setIdPhotos(idPhotoAssets);
  }, [idPhotoAssets]);

  useEffect(() => {
    if (idPhotos.length > 0) return;
    // If no id photos yet, start polling if this order might have id photo tasks
    const poll = async () => {
      try {
        setIdPhotoPolling(true);
        const res = await fetch(`/api/orders/${orderId}/id-photo-poll`, { method: "POST" });
        if (!res.ok) { setIdPhotoPolling(false); return; }
        const data = await res.json();
        if (data.results) {
          const allCompleted = Object.values(data.results as Record<string, { status: string }>).every((r) => r.status === "completed" || r.status === "failed");
          if (allCompleted) {
            clearInterval(interval);
            setIdPhotoPolling(false);
            // Refresh page to get latest assets
            router.refresh();
          } else {
            setIdPhotoMessage("证件照生成中，请稍候…");
          }
        }
      } catch {
        setIdPhotoPolling(false);
      }
    };
    const interval = setInterval(poll, 8000);
    poll();
    return () => clearInterval(interval);
  }, [orderId, idPhotos.length, router]);
  useEffect(() => {
    if (!previewAsset) return;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") setPreviewAsset(null); }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [previewAsset]);
  function toggle(assetId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId); else next.add(assetId);
      return next;
    });
  }
  async function submit() {
    setSaving(true);
    const response = await fetch(`/api/orders/${orderId}/selection`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assetIds: Array.from(selected) }) });
    setSaving(false);
    if (response.ok) { router.push(`/orders/${orderId}/pay?kind=selection`); router.refresh(); }
  }
  // 自动记录选片页浏览次数
  useEffect(() => {
    fetch(`/api/orders/${orderId}/selection-view`, { method: "POST" }).catch(() => {});
  }, [orderId]);

  const hasIdPhotos = idPhotos.length > 0;

  return <>
    <div style={{ marginBottom: 20, display: "flex", justifyContent: "flex-end", gap: 12 }}>
      {hasIdPhotos ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", background: "#fafaf8", borderRadius: 10, border: "1px solid #e5e0d8" }}>
          <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>生成底图</span>
          {idPhotos.map((asset) => (
            <div key={asset.id} style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 74, borderRadius: 6, overflow: "hidden", border: "1px solid #ddd", background: "#fff" }}>
                <img src={previewUrl(asset)} alt={`${asset.person_role === "bride" ? "新娘" : "新郎"}底图`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontSize: 11, color: "#999", marginTop: 3, display: "block" }}>{asset.person_role === "bride" ? "新娘" : "新郎"}</span>
            </div>
          ))}
        </div>
      ) : idPhotoPolling ? (
        <div style={{ padding: "8px 14px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a", fontSize: 12, color: "#b45309", whiteSpace: "nowrap" }}>
          ⏳ {idPhotoMessage || "证件照底图生成中…"}
        </div>
      ) : null}
    </div>
    <div className="promo-banner">
      <span className="promo-banner-text">🎁 满 10 张免 1 张</span>
      <span className="promo-banner-hint">
        {selected.size >= 10
          ? `已满足满10免1（共免 ${totalFreeCount} 张）${promoRemaining < 10 ? `，再选 ${promoRemaining} 张可再免1张` : ""}`
          : `再选 ${promoRemaining} 张即可免 1 张`}
      </span>
    </div>
    {hasAnyUnlocked ? (
      <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>已解锁的照片无需再次付费，你可以继续挑选其他照片加入订单。</p>
    ) : null}
    {themeGroups.map((group) => {
      const rows = buildPhotoLayoutRows(group.assets);
      return (
        <section key={group.themeId} className="theme-selection-section">
          <h2 className="theme-selection-heading">{group.themeName}</h2>
          <div className="photo-grid selection-photo-grid">
            {rows.map((row) => (
              <div className={`selection-row selection-row-${row.kind}`} key={row.id}>
                {row.assets.map((asset) => (
                  <AssetTile key={asset.id} asset={asset} selected={selected.has(asset.id)} isUnlocked={!!asset.is_unlocked} onToggle={() => toggle(asset.id)} onPreview={() => setPreviewAsset(asset)} />
                ))}
              </div>
            ))}
          </div>
        </section>
      );
    })}
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
                    style={{ aspectRatio: fixedAspectRatio(asset) ?? "3 / 4" }}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(asset.id)}
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(asset.id); } }}
                    aria-pressed={selected.has(asset.id)}
                    aria-label={`选择 ${asset.theme_name ?? "风格"} 首图`}
                  >
                    <img src={previewUrl(asset)} alt={`${asset.theme_name ?? "风格"} 首图`} onContextMenu={preventDownload} onDragStart={preventDownload} style={{userSelect:"none",pointerEvents:"none"}} />
                    <span className="selection-hover-hint">{selected.has(asset.id) ? "已选中" : "点击选择这张"}</span>
                    <span className="selection-photo-number">#{asset.sort_order}</span>
                    <span className="recommendation-theme-label">{asset.theme_name}</span>
                    <button
                      className={`selection-check-button${selected.has(asset.id) ? " selected" : ""}`}
                      type="button"
                      onClick={(event) => { event.stopPropagation(); toggle(asset.id); }}
                      aria-pressed={selected.has(asset.id)}
                      aria-label={`选择 ${asset.theme_name} 首图`}
                    >{selected.has(asset.id) ? "✓" : ""}</button>
                    <button className="selection-preview-action" type="button" onClick={(event) => { event.stopPropagation(); setPreviewAsset(asset); }}>预览大图</button>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </section>
    ) : null}
    <div className="sticky-bar">
      <div>
        <strong>
          {selected.size > 0
            ? `已选 ${selected.size} 张${unlockedCount > 0 ? `（含 ${unlockedCount} 张已解锁）` : ""}`
            : "请选择喜欢的照片"}
        </strong>
        {totalFreeCount > 0 ? <span className="promo-badge">满10免{totalFreeCount}张</span> : null}
      </div>
      <div className="actions">
        <div className="price-breakdown">
          <span className="pay-breakdown-row">
            正片：{formatCny(newCount * 5990)}
            {totalFreeCount > 0 ? `（满10免${totalFreeCount}张，本次新增免${newFreeCount}张 -${formatCny(newFreeCount * 5990)}）` : ""}
          </span>
          {unlockedCount > 0 ? <span className="pay-breakdown-row">已解锁：{unlockedCount} 张（无需付费）</span> : null}
          {canUseDepositDeduct ? <span className="pay-breakdown-row deduct-row">试看费抵扣：-{formatCny(depositDeduct)}</span> : null}
          <span className="pay-breakdown-total">实付：{formatCny(finalAmount)}</span>
        </div>
        <button onClick={submit} disabled={saving || payableCount === 0}><LockKeyhole size={18} />{saving ? "保存中..." : payableCount > 0 ? `确认解锁` : "无可解锁的新照片"}</button>
      </div>
    </div>
    {mounted && previewAsset ? createPortal((
      <div className="selection-lightbox" role="dialog" aria-modal="true" aria-label={`第 ${previewAsset.sort_order} 张带水印预览图`} onClick={() => setPreviewAsset(null)}>
        <button className="selection-lightbox-close" type="button" onClick={() => setPreviewAsset(null)} aria-label="关闭预览"><X size={22} /></button>
        <div className="selection-lightbox-content" onClick={(event) => event.stopPropagation()}>
          <p>#{previewAsset.sort_order} 4K 原图 · <strong style={{color:"#dc2626"}}>带水印</strong> · 截图/转发均有水印 · 解锁后获得无水印原文件</p>
          <img src={previewUrl(previewAsset)} alt={`4K 高清预览 ${previewAsset.sort_order}`} onContextMenu={preventDownload} onDragStart={preventDownload} style={{userSelect:"none",pointerEvents:"none"}} />
        </div>
      </div>
    ), document.body) : null}
  </>;
}
