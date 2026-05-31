"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { MouseEvent, ReactNode, SyntheticEvent } from "react";
import type { WeddingTheme } from "@/services/prompts";

type ImageRatio = "portrait" | "landscape" | "square";
type CollageSlot = "portrait-1" | "landscape-1" | "portrait-2" | "landscape-2" | "portrait-3";

function ratioFromLoadEvent(event: SyntheticEvent<HTMLImageElement>): ImageRatio | null {
  const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
  if (!width || !height) return null;
  const ratio = width / height;
  if (ratio >= 1.35) return "landscape";
  return ratio > .86 ? "square" : "portrait";
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

function ThemeImage({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className={`theme-image-placeholder ${className}`} aria-hidden="true" />;
  return (
    <span className={`theme-image-frame ${className}`} style={{ backgroundImage: `url(${src})` }}>
      <img src={src} alt={alt} onError={() => setFailed(true)} />
    </span>
  );
}

export function ThemePreviewModal({ theme, onClose, action }: { theme: WeddingTheme | null; onClose: () => void; action: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [imageRatios, setImageRatios] = useState<Record<string, ImageRatio>>({});
  const previewImages = theme?.galleryImages?.slice(0, 5) ?? [];
  const collageImages = arrangeCollageImages(previewImages, imageRatios);
  const activeLightboxImage = lightboxIndex === null ? null : previewImages[lightboxIndex];
  const lightboxNumber = lightboxIndex === null ? 0 : lightboxIndex + 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!theme) return;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [theme]);

  useEffect(() => {
    if (theme) return;
    setLightboxIndex(null);
  }, [theme]);

  useEffect(() => {
    if (!theme) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (lightboxIndex !== null) setLightboxIndex(null);
        else onClose();
      }
      if (lightboxIndex !== null && previewImages.length > 1 && event.key === "ArrowLeft") setLightboxIndex((lightboxIndex - 1 + previewImages.length) % previewImages.length);
      if (lightboxIndex !== null && previewImages.length > 1 && event.key === "ArrowRight") setLightboxIndex((lightboxIndex + 1) % previewImages.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, onClose, previewImages.length, theme]);

  function closeLightboxFromBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) setLightboxIndex(null);
  }

  function moveLightbox(step: number) {
    if (lightboxIndex === null || previewImages.length < 2) return;
    setLightboxIndex((lightboxIndex + step + previewImages.length) % previewImages.length);
  }

  function renderGalleryItem(slot: CollageSlot) {
    const item = collageImages.find((entry) => entry.slot === slot);
    if (!item || !theme) return null;
    const ratio = imageRatios[item.src] ?? (slot.includes("landscape") ? "landscape" : "portrait");
    return (
      <button type="button" className={`theme-gallery-item theme-gallery-item-${slot} theme-gallery-item-${ratio}`} onClick={() => setLightboxIndex(item.index)} aria-label={`查看第 ${item.index + 1} 张`}>
        <img src={item.src} alt={`${theme.themeName} 样片 ${item.index + 1}`} onLoad={(event) => {
          const nextRatio = ratioFromLoadEvent(event);
          if (!nextRatio) return;
          setImageRatios((current) => current[item.src] === nextRatio ? current : { ...current, [item.src]: nextRatio });
        }} />
      </button>
    );
  }

  if (!mounted || !theme) return null;

  return createPortal((
    <div className="theme-modal-overlay" role="dialog" aria-modal="true" aria-label={theme.themeName}>
      <button type="button" className="theme-modal-scrim" onClick={onClose} aria-label="关闭预览" />
      <div className="theme-modal theme-modal-panel">
        <div className="theme-modal-head">
          <div>
            <h2>{theme.themeName}</h2>
            <p className="muted">{theme.themeDescription}</p>
          </div>
          <button type="button" className="button secondary icon-button" onClick={onClose} aria-label="关闭"><X size={18} /></button>
        </div>
        <div className={`theme-gallery theme-gallery-count-${Math.max(previewImages.length, 1)}`}>
          {renderGalleryItem("portrait-1")}
          <div className="theme-gallery-side">
            <div className="theme-gallery-row">{renderGalleryItem("landscape-1")}{renderGalleryItem("portrait-2")}</div>
            <div className="theme-gallery-row">{renderGalleryItem("portrait-3")}{renderGalleryItem("landscape-2")}</div>
          </div>
          {previewImages.length === 0 ? <div className="theme-gallery-item theme-gallery-item-portrait"><ThemeImage alt={theme.themeName} /></div> : null}
        </div>
        <div className="theme-modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>关闭</button>
          {action}
        </div>
      </div>
      {activeLightboxImage ? (
        <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="图片预览" onClick={closeLightboxFromBackdrop}>
          <button type="button" className="button secondary icon-button image-lightbox-close" onClick={() => setLightboxIndex(null)} aria-label="关闭"><X size={18} /></button>
          {previewImages.length > 1 ? <button type="button" className="button secondary icon-button image-lightbox-prev" onClick={() => moveLightbox(-1)} aria-label="上一张"><ChevronLeft size={22} /></button> : null}
          <img src={activeLightboxImage} alt={`${theme.themeName} ${lightboxNumber} / {previewImages.length}`} />
          <span className="image-lightbox-count">{lightboxNumber} / {previewImages.length}</span>
          {previewImages.length > 1 ? <button type="button" className="button secondary icon-button image-lightbox-next" onClick={() => moveLightbox(1)} aria-label="下一张"><ChevronRight size={22} /></button> : null}
        </div>
      ) : null}
    </div>
  ), document.body);
}
