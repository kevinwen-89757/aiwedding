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
  const rows: PhotoLayoutRow[] = [];
  let index = 0;
  while (index < assets.length) {
    const current = assets[index];
    const currentKind = ratioKind(current);

    // 16:9 横图始终独占一行
    if (currentKind === "landscape") {
      rows.push({ id: current.id, kind: "single-landscape", assets: [current] });
      index += 1;
      continue;
    }

    const next = assets[index + 1];
    const third = assets[index + 2];
    const nextKind = next ? ratioKind(next) : null;
    const thirdKind = third ? ratioKind(third) : null;

    if (currentKind === "portrait" && nextKind === "portrait" && thirdKind === "portrait") {
      rows.push({ id: `${current.id}-${next!.id}-${third!.id}`, kind: "portrait-triple", assets: [current, next!, third!] });
      index += 3;
    } else if (currentKind === "portrait" && nextKind === "portrait") {
      rows.push({ id: `${current.id}-${next!.id}`, kind: "portrait-pair", assets: [current, next!] });
      index += 2;
    } else {
      rows.push({ id: current.id, kind: "single-portrait", assets: [current] });
      index += 1;
    }
  }
  return rows;
}
