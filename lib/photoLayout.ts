import type { OrderAsset } from "@/lib/types";

export type PhotoLayoutRow = {
  id: string;
  kind: "mixed" | "single-landscape" | "single-portrait" | "portrait-pair" | "portrait-triple";
  assets: OrderAsset[];
};

export function fixedAspectRatio(asset: OrderAsset) {
  if (asset.aspect_ratio === "16:9") return "16 / 9";
  if (asset.aspect_ratio === "3:4") return "3 / 4";
  if (asset.width && asset.height) return `${asset.width} / ${asset.height}`;
  return null;
}

export function ratioKind(asset: OrderAsset) {
  return asset.aspect_ratio === "16:9" ? "landscape" : "portrait";
}

export function buildPhotoLayoutRows(assets: OrderAsset[]) {
  // 先把竖图和横图分组
  const landscape: OrderAsset[] = [];
  const portrait: OrderAsset[] = [];
  for (const a of assets) {
    (ratioKind(a) === "landscape" ? landscape : portrait).push(a);
  }

  const rows: PhotoLayoutRow[] = [];

  // 竖图两两配对，末行允许独张
  let pi = 0;
  while (pi < portrait.length) {
    if (portrait.length - pi === 1) {
      // 末行只剩一张
      rows.push({ id: portrait[pi].id, kind: "single-portrait", assets: [portrait[pi]] });
      pi += 1;
    } else {
      rows.push({ id: `${portrait[pi].id}-${portrait[pi + 1].id}`, kind: "portrait-pair", assets: [portrait[pi], portrait[pi + 1]] });
      pi += 2;
    }
  }

  // 横图各自独占一行
  for (const a of landscape) {
    rows.push({ id: a.id, kind: "single-landscape", assets: [a] });
  }

  return rows;
}
