"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SyntheticEvent } from "react";
import { ThemePreviewModal } from "@/components/ThemePreviewModal";
import type { WeddingTheme } from "@/services/prompts";

type ImageRatio = "portrait" | "landscape" | "square";

function ratioFromImage(width: number, height: number): ImageRatio {
  const ratio = width / height;
  if (ratio >= 1.6) return "landscape";
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
  const [imageRatios, setImageRatios] = useState<Record<string, ImageRatio>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const hiddenTags = new Set(["首图", "cover", "prompt", "sweet_spot", "附送", "推荐生成", "A图"]);

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
      router.push(`/orders/${orderId}/pay?kind=deposit`);
      router.refresh();
      return;
    }
    const body = await response.json().catch(() => ({}));
    setError(body.error ?? "主题保存失败");
  }

  function closePreview() {
    setPreviewTheme(null);
  }

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
      <ThemePreviewModal
        theme={previewTheme}
        onClose={closePreview}
        action={previewTheme ? (
          <button type="button" onClick={() => toggle(previewTheme.themeId)} disabled={selected.has(previewTheme.themeId) || selected.size >= 2}>
            {selected.has(previewTheme.themeId) ? "已选择" : selected.size >= 2 ? "最多选择 2 个风格" : "选择这个风格"}
          </button>
        ) : null}
      />
    </>
  );
}
