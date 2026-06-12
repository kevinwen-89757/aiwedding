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
  if (ratio >= 1.6) return "landscape";
  return ratio > .86 ? "square" : "portrait";
}

function ratioFromLoadEvent(event: SyntheticEvent<HTMLImageElement>): ImageRatio | null {
  const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
  if (!width || !height) return null;
  const ratio = width / height;
  if (ratio >= 1.6) return "landscape";
  return ratio > .86 ? "square" : "portrait";
}

function ratioFromCoverImage(src?: string): ImageRatio | null {
  if (!src) return null;
  const landscapeCovers = [
    "/modern-minimal/cover-1.jpg",
    "/sunlit-golden-peak/cover-1.jpg",
    "/waterside/cover-1.jpg",
  ];
  if (landscapeCovers.some((cover) => src.includes(cover))) return "landscape";
  return null;
}

function verticalRowSizes(count: number) {
  const sizes: number[] = [];
  let remaining = count;
  while (remaining > 0) {
    if (remaining === 1) sizes.push(1);
    else if (remaining === 2 || remaining === 4) {
      sizes.push(2);
      remaining -= 2;
      continue;
    } else {
      sizes.push(3);
      remaining -= 3;
      continue;
    }
    remaining = 0;
  }
  return sizes;
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
      if (ratio >= 1.6) onRatioRef.current?.("landscape");
      else onRatioRef.current?.(ratio > .86 ? "square" : "portrait");
    }
  }, [src]);
  if (!src || failed) return <span className={`theme-image-placeholder ${className}`} aria-hidden="true" />;
  return (
    <span className={`theme-image-frame ${className}`}>
      <img ref={imgRef} src={src} alt={alt} onError={() => setFailed(true)} onLoad={(event) => {
        const nextRatio = ratioFromLoadEvent(event);
        if (nextRatio) onRatio?.(nextRatio);
      }} />
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

  const themeCards = themes.map((theme) => {
    const coverImage = theme.coverImages?.[0] ?? theme.coverImage ?? theme.galleryImages?.[0];
    const coverRatio = coverImage ? imageRatios[coverImage] ?? ratioFromCoverImage(coverImage) ?? ratioFromAspectRatio(theme.prompts[0]?.aspectRatio) ?? "portrait" : "portrait";
    return { theme, coverImage, coverRatio };
  });
  const verticalCards = themeCards.filter((card) => card.coverRatio !== "landscape");
  const verticalLayout = new Map<string, "two-up" | "three-up" | "single">();
  let verticalIndex = 0;
  for (const size of verticalRowSizes(verticalCards.length)) {
    const layout = size === 2 ? "two-up" : size === 3 ? "three-up" : "single";
    for (let index = 0; index < size; index += 1) {
      const card = verticalCards[verticalIndex];
      if (card) verticalLayout.set(card.theme.themeId, layout);
      verticalIndex += 1;
    }
  }

  return (
    <>
      <div className="theme-grid home-theme-grid">
        {themeCards.map(({ theme, coverImage, coverRatio }) => {
          const tags = theme.prompts[0].styleTags.filter((tag) => !hiddenTags.has(tag)).slice(0, 4);
          const layoutClass = coverRatio === "landscape" ? "" : `home-theme-card-${verticalLayout.get(theme.themeId) ?? "single"}`;
          return (
            <article key={theme.themeId} className={`theme-card home-theme-card theme-card-${coverRatio} ${layoutClass}`}>
              <button type="button" className="theme-select-area home-theme-preview-area" onClick={() => setPreviewTheme(theme)}>
                <span className="theme-cover-grid home-theme-cover-grid">
                  <span className={`theme-cover-shot home-theme-cover-shot home-theme-cover-shot-${coverRatio} theme-cover-shot-${coverRatio}`}>
                    <ThemeImage src={coverImage} alt={theme.themeName} className="theme-cover-image" onRatio={(nextRatio) => coverImage ? setImageRatios((current) => current[coverImage] === nextRatio ? current : { ...current, [coverImage]: nextRatio }) : undefined} />
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
