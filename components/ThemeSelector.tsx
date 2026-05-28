"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { MouseEvent, SyntheticEvent } from "react";
import type { WeddingTheme } from "@/services/prompts";

type ImageRatio = "portrait" | "landscape" | "square";
type CollageSlot = "portrait-1" | "landscape-1" | "portrait-2" | "landscape-2" | "portrait-3";

function ratioFromImage(width: number, height: number): ImageRatio {
  const ratio = width / height;
  if (ratio >= 1.35) return "landscape";
  return ratio > .86 ? "square" : "portrait";
}

function ratioFromLoadEvent(event: SyntheticEvent<HTMLImageElement>): ImageRatio | null {
  const img = event.currentTarget;
  if (!img) return null;
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  if (!width || !height) return null;
  return ratioFromImage(width, height);
}

function arrangeCollageImages(images: string[], ratios: Record<string, ImageRatio>) {
  const slots: { slot: CollageSlot; preferred: ImageRatio }[] = [
    { slot: "portrait-1", preferred: "portrait" },
    { slot: "landscape-1", preferred: "landscape" },
    { slot: "portrait-2", preferred: "portrait" },
    { slot: "landscape-2", preferred: "landscape" },
    { slot: "portrait-3", preferred: "portrait" }
  ];
  const used = new Set<string>();
  const byPreference = (preferred: ImageRatio) => images.find((src) => !used.has(src) && (preferred === "landscape" ? ratios[src] === "landscape" : ratios[src] !== "landscape"));
  const fallback = () => images.find((src) => !used.has(src));
  return slots.flatMap(({ slot, preferred }) => {
    const src = byPreference(preferred) ?? fallback();
    if (!src) return [];
    used.add(src);
    return [{ src, slot, index: images.indexOf(src) }];
  });
}

function ThemeImage({ src, alt, className = "", onClick, onRatio }: { src?: string; alt: string; className?: string; onClick?: () => void; onRatio?: (ratio: ImageRatio) => void }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className={`theme-image-placeholder ${className}`} aria-hidden="true" />;
  return (
    <span className={`theme-image-frame ${className}`} style={{ backgroundImage: `url(${src})` }}>
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        onClick={onClick}
        onLoad={(event) => {
          const nextRatio = ratioFromLoadEvent(event);
          if (!nextRatio) return;
          onRatio?.(nextRatio);
        }}
      />
    </span>
  );
}

export function ThemeSelector({ orderId, themes, selectedThemeIds }: { orderId: string; themes: WeddingTheme[]; selectedThemeIds: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(() => new Set(selectedThemeIds.slice(0, 2)));
  const [previewTheme, setPreviewTheme] = useState<WeddingTheme | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [imageRatios, setImageRatios] = useState<Record<string, ImageRatio>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const hiddenTags = new Set(["首图", "cover", "prompt", "sweet_spot", "附送", "推荐生成", "A图"]);
  const previewImages = previewTheme?.galleryImages?.slice(0, 5) ?? [];
  const collageImages = arrangeCollageImages(previewImages, imageRatios);
  const activeLightboxImage = lightboxIndex === null ? null : previewImages[lightboxIndex];
  const lightboxNumber = lightboxIndex === null ? 0 : lightboxIndex + 1;

  function toggle(themeId: string) {
    const next = new Set(selected);
    if (next.has(themeId)) next.delete(themeId);
    else if (next.size < 2) next.add(themeId);
    setSelected(next);
    setError("");
  }

  async function submit() {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/orders/${orderId}/themes`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ themeIds: Array.from(selected) }) });
    setSaving(false);
    if (response.ok) {
      router.push(`/orders/${orderId}/status`);
      router.refresh();
      return;
    }
    const body = await response.json().catch(() => ({}));
    setError(body.error ?? "主题保存失败");
  }

  function closePreview() {
    setPreviewTheme(null);
    setLightboxIndex(null);
  }

  function closeFromBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) closePreview();
  }

  function closeLightboxFromBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) setLightboxIndex(null);
  }

  function moveLightbox(step: number) {
    if (lightboxIndex === null || previewImages.length < 2) return;
    setLightboxIndex((lightboxIndex + step + previewImages.length) % previewImages.length);
  }

  function renderGalleryItem(slot: CollageSlot) {
    const item = collageImages.find((entry) => entry.slot === slot);
    if (!item || !previewTheme) return null;
    const ratio = imageRatios[item.src] ?? (slot.includes("landscape") ? "landscape" : "portrait");
    return (
      <button type="button" className={`theme-gallery-item theme-gallery-item-${slot} theme-gallery-item-${ratio}`} onClick={() => setLightboxIndex(item.index)} aria-label={`查看第 ${item.index + 1} 张`}>
        <img
          src={item.src}
          alt={`${previewTheme.themeName} 样片 ${item.index + 1}`}
          onLoad={(event) => {
            const nextRatio = ratioFromLoadEvent(event);
            if (!nextRatio) return;
            setImageRatios((current) => {
            return current[item.src] === nextRatio ? current : { ...current, [item.src]: nextRatio };
            });
          }}
        />
      </button>
    );
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (lightboxIndex !== null) setLightboxIndex(null);
        else if (previewTheme) closePreview();
      }
      if (lightboxIndex !== null && previewImages.length > 1 && event.key === "ArrowLeft") {
        setLightboxIndex((lightboxIndex - 1 + previewImages.length) % previewImages.length);
      }
      if (lightboxIndex !== null && previewImages.length > 1 && event.key === "ArrowRight") {
        setLightboxIndex((lightboxIndex + 1) % previewImages.length);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, previewTheme, previewImages.length]);

  return (
    <>
      <div className="theme-grid">
        {themes.map((theme) => {
          const checked = selected.has(theme.themeId);
          const coverImage = theme.coverImages?.[0] ?? theme.coverImage ?? theme.galleryImages?.[0];
          const coverRatio = coverImage ? imageRatios[coverImage] ?? "portrait" : "portrait";
          const tags = theme.prompts[0].styleTags.filter((tag) => !hiddenTags.has(tag)).slice(0, 4);
          return (
            <article key={theme.themeId} className={`theme-card theme-card-${coverRatio} ${checked ? "selected" : ""}`}>
              <button type="button" className="theme-select-area" onClick={() => toggle(theme.themeId)} aria-pressed={checked}>
                <span className="theme-cover-grid">
                  <span className={`theme-cover-shot theme-cover-shot-${coverRatio} ${coverRatio === "landscape" ? "landscapeCoverStage" : "portraitCoverStage"}`}>
                    <ThemeImage src={coverImage} alt={theme.themeName} className="theme-cover-image" onRatio={(nextRatio) => coverImage ? setImageRatios((current) => current[coverImage] === nextRatio ? current : { ...current, [coverImage]: nextRatio }) : undefined} />
                  </span>
                </span>
                <span className="theme-card-head">
                  <strong>{theme.themeName}</strong>
                  {checked ? <CheckCircle2 size={20} /> : null}
                </span>
                <span className="muted">{theme.themeDescription}</span>
                <span className="theme-tags">{tags.map((tag) => <em key={tag}>{tag}</em>)}</span>
              </button>
              <button type="button" className="button secondary theme-gallery-button" onClick={() => setPreviewTheme(theme)}>查看整套</button>
            </article>
          );
        })}
      </div>
      <div className="sticky-bar">
        <strong>已选 {selected.size} 个风格，最多 2 个</strong>
        <div className="actions">
          {error ? <span className="small">{error}</span> : null}
          <button onClick={submit} disabled={saving || selected.size < 1}>{saving ? "生成中..." : "确认风格，开始生成"}</button>
        </div>
      </div>
      {previewTheme ? (
        <div className="theme-modal-backdrop" role="dialog" aria-modal="true" aria-label={previewTheme.themeName} onClick={closeFromBackdrop}>
          <div className="theme-modal">
            <div className="theme-modal-head">
              <div>
                <h2>{previewTheme.themeName}</h2>
                <p className="muted">{previewTheme.themeDescription}</p>
              </div>
              <button type="button" className="button secondary icon-button" onClick={closePreview} aria-label="关闭"><X size={18} /></button>
            </div>
            <div className={`theme-gallery theme-gallery-count-${Math.max(previewImages.length, 1)}`}>
              {renderGalleryItem("portrait-1")}
              <div className="theme-gallery-side">
                <div className="theme-gallery-row">
                  {renderGalleryItem("landscape-1")}
                  {renderGalleryItem("portrait-2")}
                </div>
                <div className="theme-gallery-row">
                  {renderGalleryItem("portrait-3")}
                  {renderGalleryItem("landscape-2")}
                </div>
              </div>
              {previewImages.length === 0 ? <div className="theme-gallery-item theme-gallery-item-portrait"><ThemeImage alt={previewTheme.themeName} /></div> : null}
            </div>
            <div className="theme-modal-actions">
              <button type="button" className="button secondary" onClick={closePreview}>关闭</button>
              <button type="button" onClick={() => toggle(previewTheme.themeId)} disabled={selected.has(previewTheme.themeId) || selected.size >= 2}>
                {selected.has(previewTheme.themeId) ? "已选择" : selected.size >= 2 ? "最多选择 2 个风格" : "选择这个风格"}
              </button>
            </div>
          </div>
          {activeLightboxImage ? (
            <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="图片预览" onClick={closeLightboxFromBackdrop}>
              <button type="button" className="button secondary icon-button image-lightbox-close" onClick={() => setLightboxIndex(null)} aria-label="关闭"><X size={18} /></button>
              {previewImages.length > 1 ? (
                <button type="button" className="button secondary icon-button image-lightbox-prev" onClick={() => moveLightbox(-1)} aria-label="上一张"><ChevronLeft size={22} /></button>
              ) : null}
              <img src={activeLightboxImage} alt={`${previewTheme.themeName} ${lightboxNumber} / ${previewImages.length}`} />
              <span className="image-lightbox-count">{lightboxNumber} / {previewImages.length}</span>
              {previewImages.length > 1 ? (
                <button type="button" className="button secondary icon-button image-lightbox-next" onClick={() => moveLightbox(1)} aria-label="下一张"><ChevronRight size={22} /></button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
