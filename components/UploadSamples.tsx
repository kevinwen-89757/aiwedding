import { existsSync } from "node:fs";
import path from "node:path";

function publicFileExists(src: string) {
  return existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
}

function SampleCard({ src, alt, description }: { src: string; alt: string; description: string }) {
  const hasImage = publicFileExists(src);
  return (
    <article className="sample-card">
      <div className="sample-image">
        {hasImage ? <img src={src} alt={alt} /> : null}
      </div>
      <p className="muted">{description}</p>
    </article>
  );
}

export function UploadSamples() {
  return (
    <section className="card upload-samples">
      <h2>什么样的照片更适合生成？</h2>
      <p className="muted sample-intro">尽量选择清晰、自然、无遮挡的正脸照片。</p>
      <h3 className="sample-group-title">人像示例</h3>
      <div className="sample-grid">
        <SampleCard src="/demo/upload-sample-1.jpg" alt="人像示例 1" description="尽量使用原相机照片，避免严重美颜和低清截图。" />
        <SampleCard src="/demo/upload-sample-2.jpg" alt="人像示例 2" description="五官完整、光线充足、无遮挡。" />
      </div>
    </section>
  );
}
