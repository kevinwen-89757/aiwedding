"use client";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PreviewState = {
  bride: string;
  groom: string;
};

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;
const MAX_COMPRESSED_BYTES = 2 * 1024 * 1024;
const LARGE_IMAGE_MESSAGE = "图片较大，请更换较小文件或重新选择压缩后的照片。";

function RequiredMark() {
  return <sup className="required-star" aria-hidden="true">*</sup>;
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败，请重新选择照片。"));
    };
    image.src = url;
  });
}

async function compressReferencePhoto(file: File, roleName: string) {
  const image = await loadImageFromFile(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器无法压缩图片，请更换较小文件后重试。");
  context.drawImage(image, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new Error("图片压缩失败，请更换较小文件后重试。");
  if (blob.size > MAX_COMPRESSED_BYTES) throw new Error(`${roleName}：${LARGE_IMAGE_MESSAGE}`);
  const baseName = file.name.replace(/\.[^.]+$/, "") || roleName;
  return new File([blob], `${baseName}-compressed.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

export function UploadForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [previews, setPreviews] = useState<PreviewState>({ bride: "", groom: "" });
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
  }
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const name = typeof form.get("customerName") === "string" ? String(form.get("customerName")).trim() : "";
    const bridePhoto = form.get("bridePhoto");
    const groomPhoto = form.get("groomPhoto");
    const hasBride = bridePhoto instanceof File && bridePhoto.size > 0;
    const hasGroom = groomPhoto instanceof File && groomPhoto.size > 0;
    if (!name) { setError("请填写姓名，方便后台识别订单"); return; }
    if (!hasBride) { setError("请上传新娘正脸照"); return; }
    if (!hasGroom) { setError("请上传新郎正脸照"); return; }
    if (!authorized || !understood) { setError("请先勾选两项隐私授权与 AI 生成说明。"); return; }
    setSubmitting(true);
    try {
      const compressedBride = await compressReferencePhoto(bridePhoto, "新娘正脸照");
      const compressedGroom = await compressReferencePhoto(groomPhoto, "新郎正脸照");
      form.set("customerName", name);
      form.set("bridePhoto", compressedBride);
      form.set("groomPhoto", compressedGroom);
      const response = await fetch("/api/orders", { method: "POST", body: form });
      const payload = await response.json().catch(() => ({ error: "创建订单失败", detail: `服务器返回了不可解析内容，状态码 ${response.status}` }));
      setSubmitting(false);
      if (!response.ok) {
        const errorText = [payload.error ?? `上传失败，状态码 ${response.status}`, payload.detail].filter(Boolean).join("\n");
        setError(errorText);
        return;
      }
      router.push(`/orders/${payload.orderId}/themes`);
    } catch (err) { setSubmitting(false); setError(err instanceof Error ? err.message : "上传失败，请查看终端日志"); }
  }
  const hasName = Boolean(customerName.trim());
  const hasBothPhotos = Boolean(previews.bride && previews.groom);
  const hasConsent = authorized && understood;
  const canSubmit = hasName && hasBothPhotos && hasConsent;
  const hint = !hasName ? "请填写姓名，方便后台识别订单。" : !previews.bride ? "请上传新娘正脸照。" : !previews.groom ? "请上传新郎正脸照。" : !hasConsent ? "请勾选两项授权后继续。" : "";
  return <form className="form upload-form" onSubmit={onSubmit}><div className="form-row"><label><span className="field-label">姓名 / 订单备注 <RequiredMark /></span><input name="customerName" placeholder="用于后台识别订单" required value={customerName} onChange={(event)=>setCustomerName(event.currentTarget.value)} /></label><label>手机<input name="customerPhone" placeholder="可选" /></label></div><div className="upload-file-row"><label className="upload-file-control"><span className="field-label">新娘正脸照 <RequiredMark /></span><input name="bridePhoto" type="file" accept="image/png,image/jpeg,image/webp" required onChange={(event)=>updatePreview("bride", event.currentTarget.files)} /></label><label className="upload-file-control"><span className="field-label">新郎正脸照 <RequiredMark /></span><input name="groomPhoto" type="file" accept="image/png,image/jpeg,image/webp" required onChange={(event)=>updatePreview("groom", event.currentTarget.files)} /></label></div><div className="upload-preview-grid"><figure className="upload-local-preview">{previews.bride ? <img src={previews.bride} alt="新娘正脸照预览" /> : <span>新娘正脸照预览</span>}<figcaption>新娘正脸照</figcaption></figure><figure className="upload-local-preview">{previews.groom ? <img src={previews.groom} alt="新郎正脸照预览" /> : <span>新郎正脸照预览</span>}<figcaption>新郎正脸照</figcaption></figure></div><label className="check-row"><input checked={authorized} onChange={(event)=>setAuthorized(event.target.checked)} type="checkbox" />我确认上传的是本人照片，或已获得照片中人物授权</label><label className="check-row"><input checked={understood} onChange={(event)=>setUnderstood(event.target.checked)} type="checkbox" />我理解生成结果为 AI 写真图，不等同于真实拍摄照片</label>{hint ? <p className="small auth-hint">{hint}</p> : null}{error ? <div className="error-box upload-error">{error}</div> : null}<button disabled={submitting || !canSubmit} type="submit"><Upload size={18} />{submitting ? "压缩并上传中..." : "上传并创建订单"}</button></form>;
}
