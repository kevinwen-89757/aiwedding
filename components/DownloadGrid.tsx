import { Download } from "lucide-react";
import { buildPhotoLayoutRows, fixedAspectRatio, ratioKind } from "@/lib/photoLayout";
import type { OrderAsset } from "@/lib/types";

function originalUrl(asset: OrderAsset) {
  return `/api/download/${asset.id}`;
}

function aspectRatioFor(asset: OrderAsset) {
  return fixedAspectRatio(asset) ?? "3 / 4";
}

export function DownloadGrid({ assets }: { assets: OrderAsset[] }) {
  const rows = buildPhotoLayoutRows(assets);
  return (
    <div className="photo-grid selection-photo-grid download-photo-grid">
      {rows.map((row) => (
        <div className={`selection-row selection-row-${row.kind}`} key={row.id}>
          {row.assets.map((asset) => (
            <article className={`photo-tile selection-photo-tile selection-photo-tile-${ratioKind(asset)} download-photo-tile`} key={asset.id}>
              <div className="selection-preview-frame download-preview-frame" style={{ aspectRatio: aspectRatioFor(asset) }}>
                <img src={originalUrl(asset)} alt={`无水印原图 ${asset.sort_order}`} />
                <span className="selection-photo-number">#{asset.sort_order}</span>
                <a className="button secondary download-photo-action" href={originalUrl(asset)} download>
                  <Download size={18} />下载
                </a>
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}
