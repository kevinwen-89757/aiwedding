"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { SyntheticEvent } from "react";
import { ThemePreviewModal } from "@/components/ThemePreviewModal";
import type { WeddingTheme } from "@/services/prompts";

type ImageRatio = "portrait" | "landscape" | "square";

function ratioFromAspectRatio(aspectRatio?: string | null): ImageRatio | null {
  if (!aspectRatio) return null;
  const [rawWidth, rawHeight] = aspectRatio.split(":").map((value) => Number.parseFloat(value));
  if (!rawWidth || !rawHeight) return null;
  const ratio = rawWidth / rawHeight;
  if (ratio >= 1.35) return "landscape";
  return ratio > .86 ? "square" : "portrait";
}

function ratioFromLoadEvent(event: SyntheticEvent<HTMLImageElement>): ImageRatio | null {
  const img = event.currentTarget;
  if (!img) return null;
  const { naturalWidth: width, naturalHeight: height } = img;
  if (!width || !height) return null;
  if (width / height >= 1.35) return "landscape";
  return width / height > 0.86 ? "square" : "portrait";
}

function ThemeImage({ src, alt, className = "", onRatio }: { src?: string; alt: string; className?: string; onRatio?: (ratio: ImageRatio) => void }) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const onRatioRef = useRef(onRatio);
  onRatioRef.current = onRatio;
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) {
      const { naturalWidth: width, naturalHeight: height } = img;
      const ratio = width / height;
      if (ratio >= 1.35) onRatioRef.current?.("landscape");
      else onRatioRef.current?.(ratio > .86 ? "square" : "portrait");
    }
  }, [src]);
  if (!src || failed) return <span className={`theme-image-placeholder ${className}`} aria-hidden="true" />;
  return (
    <span className={`theme-image-frame ${className}`}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        onLoad={(event) => {
          const nextRatio = ratioFromLoadEvent(event);
          if (nextRatio) onRatio?.(nextRatio);
        }}
      />
    </span>
  );
}

export function HomeThemeShowcase({ themes }: { themes: WeddingTheme[] }) {
  const [previewTheme, setPreviewTheme] = useState<WeddingTheme | null>(null);
  const [imageRatios, setImageRatios] = useState<Record<string, ImageRatio>>({});
  const hiddenTags = new Set(["首图", "cover", "prompt", "sweet_spot", "附送", "推荐生成", "A图"]);

  function closePreview() {
    setPreviewTheme(null);
  }

  return (
    <>
      <div className="theme-grid home-theme-grid">
        {themes.map((theme) => {
          const coverImage = theme.coverImages?.[0] ?? theme.coverImage ?? theme.galleryImages?.[0];
          const coverRatio = coverImage
            ? imageRatios[coverImage] ?? ratioFromAspectRatio(theme.prompts[0]?.aspectRatio) ?? "portrait"
            : "portrait";
          const isLandscape = coverRatio === "landscape";
          const tags = theme.prompts[0].styleTags.filter((tag) => !hiddenTags.has(tag)).slice(0, 4);
          return (
            <article
              key={theme.themeId}
              className={`theme-card ${isLandscape ? "theme-card-landscape" : "theme-card-portrait"}`}
            >
              <button type="button" className="theme-select-area home-theme-preview-area" onClick={() => setPreviewTheme(theme)}>
                <span className="theme-cover-grid">
                  <span className={`theme-cover-shot ${isLandscape ? "theme-cover-shot-landscape" : "theme-cover-shot-portrait"} ${isLandscape ? "landscapeCoverStage" : "portraitCoverStage"}`}>
                    <ThemeImage
                      src={coverImage}
                      alt={theme.themeName}
                      className="theme-cover-image"
                      onRatio={(nextRatio) => coverImage ? setImageRatios((current) => current[coverImage] === nextRatio ? current : { ...current, [coverImage]: nextRatio }) : undefined}
                    />
                  </span>
                </span>
                <span className="theme-card-head"><strong>{theme.themeName}</strong></span>
                <span className="muted">{theme.themeDescription}</span>
                <span className="theme-tags">{tags.map((tag) => <em key={tag}>{tag}</em>)}</span>
              </button>
              <button type="button" className="button secondary theme-gallery-button" onClick={() => setPreviewTheme(theme)}>预览风格</button>
            </article>
          );
        })}
      </div>
      <div className="home-theme-cta"><Link className="button" href="/upload">上传正脸照，生成我的婚纱预览</Link></div>
      <ThemePreviewModal theme={previewTheme} onClose={closePreview} action={<Link className="button" href="/upload">上传正脸照，生成我的婚纱预览</Link>} />
    </>
  );
}
