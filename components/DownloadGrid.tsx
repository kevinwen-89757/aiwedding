"use client";
import { Download, Package } from "lucide-react";
import { useState } from "react";
import { buildPhotoLayoutRows, fixedAspectRatio, ratioKind } from "@/lib/photoLayout";
import type { OrderAsset } from "@/lib/types";

function originalUrl(asset: OrderAsset) {
  return `/api/download/${asset.id}`;
}

function aspectRatioFor(asset: OrderAsset) {
  return fixedAspectRatio(asset) ?? "3 / 4";
}

function downloadAll(assets: OrderAsset[]) {
  assets.forEach((asset, index) => {
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = originalUrl(asset);
      link.download = `ai-wedding-${asset.sort_order}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, index * 600);
  });
}

export function DownloadGrid({ assets }: { assets: OrderAsset[] }) {
  const [downloading, setDownloading] = useState(false);
  const rows = buildPhotoLayoutRows(assets);

  function handleDownloadAll() {
    setDownloading(true);
    downloadAll(assets);
    setTimeout(() => setDownloading(false), assets.length * 600 + 1000);
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>共 {assets.length} 张无水印原图</h3>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>点击下方按钮可一键保存全部，浏览器可能会询问是否允许多文件下载。</p>
        </div>
        <button
          className="button"
          type="button"
          onClick={handleDownloadAll}
          disabled={downloading}
          style={{ whiteSpace: "nowrap" }}
        >
          <Package size={18} />
          {downloading ? "正在保存..." : "一键下载全部"}
        </button>
      </div>
      <div className="photo-grid selection-photo-grid download-photo-grid">
        {rows.map((row) => (
          <div className={`selection-row selection-row-${row.kind}`} key={row.id}>
            {row.assets.map((asset) => (
              <article className={`photo-tile selection-photo-tile selection-photo-tile-${ratioKind(asset)} download-photo-tile`} key={asset.id}>
                <div className="selection-preview-frame download-preview-frame" style={{ aspectRatio: aspectRatioFor(asset) }}>
                  <img src={originalUrl(asset)} alt={`无水印原图 ${asset.sort_order}`} />
                  <span className="selection-photo-number">#{asset.sort_order}</span>
                  <a className="button secondary download-photo-action" href={originalUrl(asset)} download={`ai-wedding-${asset.sort_order}.jpg`}>
                    <Download size={18} />下载
                  </a>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
