"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PreviewState = {
  bride: string;
  groom: string;
};

function RequiredMark() {
  return <sup className="required-star" aria-hidden="true">*</sup>;
}

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const COMPRESS_TARGET_BYTES = 5 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isHeicFile(file: File): boolean {
  const heicExts = [".heic", ".heif"];
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return heicExts.includes(ext);
}

async function compressImage(file: File, maxBytes = COMPRESS_TARGET_BYTES): Promise<File> {
  if (file.size <= maxBytes) return file;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片无法解析，请尝试上传 JPG/PNG 格式"));
    image.src = URL.createObjectURL(file);
  });
  const maxWidth = 2560;
  let width = img.width;
  let height = img.height;
  if (width > maxWidth) {
    height = Math.round(height * (maxWidth / width));
    width = maxWidth;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持图片压缩，请换用 Chrome/Safari/Edge 重试");
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(img.src);

  const tryQuality = async (quality: number) => {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return null;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg", lastModified: Date.now() });
  };

  for (const quality of [0.92, 0.88, 0.85, 0.8, 0.75, 0.7]) {
    const compressed = await tryQuality(quality);
    if (compressed && compressed.size <= maxBytes) return compressed;
  }
  const final = await tryQuality(0.65);
  if (final && final.size <= maxBytes) return final;
  if (final && final.size <= MAX_UPLOAD_BYTES) return final;
  throw new Error(`图片压缩后仍超过 ${formatFileSize(MAX_UPLOAD_BYTES)} 上限，请选择更小的图片或降低原图分辨率后重试。`);
}

type FileInfo = { name: string; size: number; type: string; isHeic: boolean };

/**
 * 用预签名 URL 把文件直接 PUT 到 COS（不经过我们自己的服务器）。
 * 这样大照片也不会占用 Vercel 函数的 60 秒上限。onProgress 回传绝对已上传字节数。
 */
function uploadToPresignedUrl(url: string, file: File, mimeType: string, onProgress: (loaded: number, total: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    // 必须与后端签名时使用的 Content-Type 一致，否则 COS 会拒绝（403 签名不匹配）
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded, event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`照片上传失败（状态码 ${xhr.status}），请重试。`));
    };
    xhr.onerror = () => reject(new Error("网络错误，照片上传失败，请检查网络后重试。"));
    xhr.ontimeout = () => reject(new Error("照片上传超时，请稍后重试。"));
    xhr.send(file);
  });
}

export function UploadForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [photoType, setPhotoType] = useState<"id_photo" | "casual_photo">("id_photo");
  const [previews, setPreviews] = useState<PreviewState>({ bride: "", groom: "" });
  const [fileInfos, setFileInfos] = useState<{ bride?: FileInfo; groom?: FileInfo }>({});
  const [compressing, setCompressing] = useState(false);
  const [compressStatus, setCompressStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "uploading" | "processing">("idle");
  const previewsRef = useRef(previews);
  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);
  function updatePreview(role: keyof PreviewState, fileList: FileList | null) {
    const file = fileList?.[0];
    setPreviews((current) => {
      if (current[role]) URL.revokeObjectURL(current[role]);
      const next = { ...current, [role]: file ? URL.createObjectURL(file) : "" };
      previewsRef.current = next;
      return next;
    });
    setFileInfos((current) => {
      if (!file) return { ...current, [role]: undefined };
      return { ...current, [role]: { name: file.name, size: file.size, type: file.type, isHeic: isHeicFile(file) } };
    });
    setError("");
  }
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const name = typeof form.get("customerName") === "string" ? String(form.get("customerName")).trim() : "";
    const phone = typeof form.get("customerPhone") === "string" ? String(form.get("customerPhone")).trim() : "";
    const bridePhoto = form.get("bridePhoto");
    const groomPhoto = form.get("groomPhoto");
    const hasBride = bridePhoto instanceof File && bridePhoto.size > 0;
    const hasGroom = groomPhoto instanceof File && groomPhoto.size > 0;
    if (!name) { setError("请填写姓名，方便后台识别订单"); return; }
    if (!phone) { setError("请填写手机号，用于验证查询订单"); return; }
    if (!hasBride) { setError("请上传新娘正脸照"); return; }
    if (!hasGroom) { setError("请上传新郎正脸照"); return; }
    if (!authorized || !understood) { setError("请先勾选两项隐私授权与 AI 生成说明。"); return; }

    // HEIC 提前拦截
    if (bridePhoto instanceof File && isHeicFile(bridePhoto)) {
      setError("新娘照片为 HEIC 格式，iPhone 用户请在相册中选择照片后点击「选项」→ 勾选「最兼容」导出为 JPG 后再上传。");
      return;
    }
    if (groomPhoto instanceof File && isHeicFile(groomPhoto)) {
      setError("新郎照片为 HEIC 格式，iPhone 用户请在相册中选择照片后点击「选项」→ 勾选「最兼容」导出为 JPG 后再上传。");
      return;
    }

    setCompressing(true);
    setCompressStatus("正在智能压缩图片，请稍候…");
    try {
      const brideCompressed = bridePhoto instanceof File ? await compressImage(bridePhoto) : null;
      setCompressStatus("新娘照片已处理，正在处理新郎照片…");
      const groomCompressed = groomPhoto instanceof File ? await compressImage(groomPhoto) : null;
      setCompressing(false);
      setCompressStatus("");

      const files: { role: "bride" | "groom"; file: File; mimeType: string; size: number }[] = [];
      if (brideCompressed) files.push({ role: "bride", file: brideCompressed, mimeType: brideCompressed.type || "image/jpeg", size: brideCompressed.size });
      if (groomCompressed) files.push({ role: "groom", file: groomCompressed, mimeType: groomCompressed.type || "image/jpeg", size: groomCompressed.size });

      setSubmitting(true);
      try {
        // 1) 向后端申请预签名上传凭证（极小请求，瞬时返回）
        setUploadPhase("uploading");
        setUploadProgress(0);
        setCompressStatus("正在准备安全上传通道…");
        const presignRes = await fetch("/api/orders/presign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ uploads: files.map((f) => ({ role: f.role, fileName: f.file.name, mimeType: f.mimeType, size: f.size })) }),
        });
        const presignData: { orderId?: string; uploads?: unknown[]; error?: string } = await presignRes.json().catch(() => ({}));
        if (!presignRes.ok || !presignData.orderId || !Array.isArray(presignData.uploads)) {
          throw new Error(presignData.error || "获取上传凭证失败，请稍后重试。");
        }
        const { orderId, uploads: presigned } = presignData as {
          orderId: string;
          uploads: Array<{ role: string; relativePath: string; uploadUrl: string; mimeType: string }>;
        };

        // 2) 浏览器把照片直接上传到 COS（不经过服务器），实时汇总进度
        setCompressStatus("正在上传照片到云端…");
        const totalBytes = files.reduce((s, f) => s + f.size, 0);
        const perFileLoaded: Record<string, number> = {};
        let loadedBytes = 0;
        const metaByRole: Record<string, { width: number | null; height: number | null }> = {};
        await Promise.all(
          files.map(async (f) => {
            const target = presigned.find((u) => u.role === f.role);
            if (!target) throw new Error("上传凭证不完整，请重试。");
            // 客户端直接计算尺寸，避免再把照片传回服务器算元数据
            let dims: { width: number | null; height: number | null } = { width: null, height: null };
            try {
              const bmp = await createImageBitmap(f.file);
              dims = { width: bmp.width, height: bmp.height };
              bmp.close?.();
            } catch { /* 尺寸未知不影响上传 */ }
            metaByRole[f.role] = dims;
            await uploadToPresignedUrl(target.uploadUrl, f.file, f.mimeType, (loaded) => {
              const prev = perFileLoaded[f.role] ?? 0;
              loadedBytes += loaded - prev;
              perFileLoaded[f.role] = loaded;
              const pct = totalBytes > 0 ? Math.min(99, Math.round((loadedBytes / totalBytes) * 100)) : 0;
              setUploadProgress(pct);
            });
          })
        );
        setUploadProgress(100);
        setUploadPhase("processing");
        setCompressStatus("照片已上传，正在创建订单…");

        // 3) 仅把「orderId + 照片在 COS 的路径 + 尺寸」发给服务器落库（请求体极小，远小于 60s）
        const email = form.get("customerEmail");
        const createRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            orderId,
            customerName: name,
            customerPhone: phone,
            customerEmail: email ? String(email) : undefined,
            photoType,
            photos: files.map((f) => ({
              role: f.role,
              relativePath: presigned.find((u) => u.role === f.role)!.relativePath,
              mimeType: f.mimeType,
              width: metaByRole[f.role]?.width ?? null,
              height: metaByRole[f.role]?.height ?? null,
              size: f.size,
            })),
          }),
        });
        const createData: { orderId?: string; error?: string } = await createRes.json().catch(() => ({}));
        if (!createRes.ok || !createData.orderId) {
          throw new Error(createData.error || `创建订单失败（状态码 ${createRes.status}）`);
        }
        router.push(`/orders/${createData.orderId}/themes`);
      } catch (err) {
        setSubmitting(false);
        setUploadPhase("idle");
        setUploadProgress(0);
        setCompressStatus("");
        setError(err instanceof Error ? err.message : "上传失败，请稍后重试。");
      }
    } catch (err) {
      setCompressing(false);
      setCompressStatus("");
      setSubmitting(false);
      setUploadPhase("idle");
      setUploadProgress(0);
      setError(err instanceof Error ? err.message : "上传失败，请查看终端日志");
    }
  }
  const hasName = Boolean(customerName.trim());
  const hasPhone = Boolean(customerPhone.trim());
  const hasBothPhotos = Boolean(previews.bride && previews.groom);
  const hasConsent = authorized && understood;
  const canSubmit = hasName && hasPhone && hasBothPhotos && hasConsent;
  const hint = !hasName ? "请填写姓名，方便后台识别订单。" : !hasPhone ? "请填写手机号，用于验证查询订单。" : !previews.bride ? "请上传新娘正脸照。" : !previews.groom ? "请上传新郎正脸照。" : !hasConsent ? "请勾选两项授权后继续。" : "";

  function renderFileHint(role: "bride" | "groom") {
    const info = fileInfos[role];
    if (!info) return null;
    return (
      <span className="file-hint" style={{ fontSize: 12, color: info.isHeic ? "#ef4444" : "#6b7280", marginTop: 4, display: "block" }}>
        {info.isHeic
          ? `⚠️ HEIC 格式不支持，请导出为 JPG 后重新上传`
          : `${info.name} · ${formatFileSize(info.size)}${info.size > COMPRESS_TARGET_BYTES ? " · 将自动压缩后上传" : ""}`}
      </span>
    );
  }

  return <form className="form upload-form" onSubmit={onSubmit}>
    <div className="form-row">
      <label>
        <span className="field-label">姓名 / 订单备注 <RequiredMark /></span>
        <input type="text" name="customerName" placeholder="用于后台识别订单" required value={customerName} autoComplete="name" inputMode="text" pattern="[\u4e00-\u9fa5a-zA-Z\s]+" title="请输入中文或英文姓名" onChange={(event)=>setCustomerName(event.currentTarget.value.replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ""))} />
      </label>
      <label>
        <span className="field-label">手机号 <RequiredMark /></span>
        <input name="customerPhone" placeholder="仅用于验证查询订单" required maxLength={11} inputMode="tel" pattern="[0-9]{11}" value={customerPhone} onChange={(event)=>setCustomerPhone(event.currentTarget.value.replace(/\D/g, "").slice(0, 11))} />
      </label>
    </div>
    <div className="photo-type-section" style={{ marginBottom: 20, padding: "14px 16px", background: "#f8f6f3", borderRadius: 10, border: "1px solid #e8e3dc" }}>
      <p className="field-label" style={{ marginBottom: 12 }}>照片类型 <RequiredMark /></p>
      <div style={{ display: "flex", gap: 12 }}>
        <label
          onClick={() => setPhotoType("id_photo")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            padding: "12px 16px",
            borderRadius: 10,
            border: `2px solid ${photoType === "id_photo" ? "#a0845c" : "#ddd5c9"}`,
            background: photoType === "id_photo" ? "#faf7f2" : "#fff",
            transition: "all 0.15s ease",
            userSelect: "none",
          }}
        >
          <input type="radio" name="photoType" value="id_photo" checked={photoType === "id_photo"} onChange={() => setPhotoType("id_photo")} style={{ accentColor: "#a0845c", width: 18, height: 18, flexShrink: 0 }} />
          <span style={{ fontSize: 14, lineHeight: 1.5, color: "#333" }}>证件照<span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>（推荐，效果最佳）</span></span>
        </label>
        <label
          onClick={() => setPhotoType("casual_photo")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            padding: "12px 16px",
            borderRadius: 10,
            border: `2px solid ${photoType === "casual_photo" ? "#a0845c" : "#ddd5c9"}`,
            background: photoType === "casual_photo" ? "#faf7f2" : "#fff",
            transition: "all 0.15s ease",
            userSelect: "none",
          }}
        >
          <input type="radio" name="photoType" value="casual_photo" checked={photoType === "casual_photo"} onChange={() => setPhotoType("casual_photo")} style={{ accentColor: "#a0845c", width: 18, height: 18, flexShrink: 0 }} />
          <span style={{ fontSize: 14, lineHeight: 1.5, color: "#333" }}>生活照 / 自拍照</span>
        </label>
      </div>
      {photoType === "casual_photo" ? (
        <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, fontSize: 13, color: "#b45309", lineHeight: 1.6 }}>
          <strong>提示：</strong>生活照/自拍照受光线、角度、表情等影响，生成效果可能不如证件照理想。
          <br />
          如手边有<strong>高清证件照</strong>，强烈建议更换为证件照上传，以获得最佳生成质感。
        </div>
      ) : null}
    </div>
    <div className="upload-file-row">
      <label className="upload-file-control">
        <span className="field-label">新娘正脸照 <RequiredMark /></span>
        <input name="bridePhoto" type="file" accept="image/png,image/jpeg,image/webp" required onChange={(event)=>updatePreview("bride", event.currentTarget.files)} />
        {renderFileHint("bride")}
      </label>
      <label className="upload-file-control">
        <span className="field-label">新郎正脸照 <RequiredMark /></span>
        <input name="groomPhoto" type="file" accept="image/png,image/jpeg,image/webp" required onChange={(event)=>updatePreview("groom", event.currentTarget.files)} />
        {renderFileHint("groom")}
      </label>
    </div>
    <div className="upload-preview-grid">
      <figure className="upload-local-preview">{previews.bride ? <img src={previews.bride} alt="新娘正脸照预览" /> : <span>新娘正脸照预览</span>}<figcaption>新娘正脸照</figcaption></figure>
      <figure className="upload-local-preview">{previews.groom ? <img src={previews.groom} alt="新郎正脸照预览" /> : <span>新郎正脸照预览</span>}<figcaption>新郎正脸照</figcaption></figure>
    </div>
    <label className="check-row"><input checked={authorized} onChange={(event)=>setAuthorized(event.target.checked)} type="checkbox" />我确认上传的是本人照片，或已获得照片中人物授权</label>
    <label className="check-row"><input checked={understood} onChange={(event)=>setUnderstood(event.target.checked)} type="checkbox" />我理解生成结果为 AI 写真图，不等同于真实拍摄照片</label>
    {hint ? <p className="small auth-hint">{hint}</p> : null}
    {compressStatus ? <p className="small compress-hint" style={{ color: "#3b82f6" }}>{compressStatus}</p> : null}
    {error ? <div className="error-box" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#dc2626", marginTop: 8, whiteSpace: "pre-line" }}>{error}</div> : null}
    <div className="actions" style={{ marginTop: 16 }}>
      <button type="submit" className="button" disabled={!canSubmit || compressing || submitting}>
        {compressing ? "正在压缩…" : submitting ? (uploadPhase === "uploading" ? `上传中 ${uploadProgress}%` : "创建订单中…") : "提交订单"}
      </button>
    </div>
    {uploadPhase !== "idle" ? (
      <div className="upload-progress" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
          <span>{uploadPhase === "uploading" ? "正在上传照片…" : "照片已上传，正在创建订单…"}</span>
          <span>{uploadPhase === "uploading" ? `${uploadProgress}%` : "请稍候"}</span>
        </div>
        <div style={{ height: 8, background: "#eee", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${uploadPhase === "uploading" ? uploadProgress : 100}%`, background: "linear-gradient(90deg,#a0845c,#c9a876)", transition: "width 0.2s ease", borderRadius: 999 }} />
        </div>
      </div>
    ) : null}
    <p className="small" style={{ marginTop: 8, color: "#9ca3af", fontSize: 12 }}>
      支持 JPG、PNG、WebP 格式，单张最大支持 {formatFileSize(MAX_UPLOAD_BYTES)}。系统会自动压缩过大的图片。
    </p>
  </form>;
}
