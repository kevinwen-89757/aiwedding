"use client";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PreviewState = {
  bride: string;
  groom: string;
};

function RequiredMark() {
  return <sup className="required-star" aria-hidden="true">*</sup>;
}

async function compressImage(file: File, maxBytes = 2 * 1024 * 1024): Promise<File> {
  if (file.size <= maxBytes) return file;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
  const maxWidth = 1920;
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
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(img.src);

  const tryQuality = async (quality: number) => {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return null;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg", lastModified: Date.now() });
  };

  for (const quality of [0.92, 0.85, 0.8, 0.75, 0.7]) {
    const compressed = await tryQuality(quality);
    if (compressed && compressed.size <= maxBytes) return compressed;
  }
  const final = await tryQuality(0.65);
  return final ?? file;
}

export function UploadForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [previews, setPreviews] = useState<PreviewState>({ bride: "", groom: "" });
  const [compressing, setCompressing] = useState(false);
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
    setCompressing(true);
    const brideCompressed = bridePhoto instanceof File ? await compressImage(bridePhoto) : null;
    const groomCompressed = groomPhoto instanceof File ? await compressImage(groomPhoto) : null;
    setCompressing(false);
    const uploadForm = new FormData();
    uploadForm.append("customerName", name);
    uploadForm.append("customerPhone", phone);
    if (brideCompressed) uploadForm.append("bridePhoto", brideCompressed);
    if (groomCompressed) uploadForm.append("groomPhoto", groomCompressed);
    const email = form.get("customerEmail");
    if (email) uploadForm.append("customerEmail", String(email));

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", { method: "POST", body: uploadForm });
      const payload = await response.json().catch(() => ({ error: "创建订单失败", detail: `服务器返回了不可解析内容，状态码 ${response.status}` }));
      if (!response.ok) {
        setSubmitting(false);
        const errorText = [payload.error ?? `上传失败，状态码 ${response.status}`, payload.detail].filter(Boolean).join("\n");
        setError(errorText);
        return;
      }
      router.push(`/orders/${payload.orderId}/themes`);
    } catch (err) { setSubmitting(false); setError(err instanceof Error ? err.message : "上传失败，请查看终端日志"); }
  }
  const hasName = Boolean(customerName.trim());
  const hasPhone = Boolean(customerPhone.trim());
  const hasBothPhotos = Boolean(previews.bride && previews.groom);
  const hasConsent = authorized && understood;
  const canSubmit = hasName && hasPhone && hasBothPhotos && hasConsent;
  const hint = !hasName ? "请填写姓名，方便后台识别订单。" : !hasPhone ? "请填写手机号，用于验证查询订单。" : !previews.bride ? "请上传新娘正脸照。" : !previews.groom ? "请上传新郎正脸照。" : !hasConsent ? "请勾选两项授权后继续。" : "";
  return <form className="form upload-form" onSubmit={onSubmit}><div className="form-row"><label><span className="field-label">姓名 / 订单备注 <RequiredMark /></span><input name="customerName" placeholder="用于后台识别订单" required value={customerName} onChange={(event)=>setCustomerName(event.currentTarget.value)} /></label><label><span className="field-label">手机号 <RequiredMark /></span><input name="customerPhone" placeholder="仅用于验证查询订单" required value={customerPhone} onChange={(event)=>setCustomerPhone(event.currentTarget.value)} /></label></div><div className="upload-file-row"><label className="upload-file-control"><span className="field-label">新娘正脸照 <RequiredMark /></span><input name="bridePhoto" type="file" accept="image/png,image/jpeg,image/webp" required onChange={(event)=>updatePreview("bride", event.currentTarget.files)} /></label><label className="upload-file-control"><span className="field-label">新郎正脸照 <RequiredMark /></span><input name="groomPhoto" type="file" accept="image/png,image/jpeg,image/webp" required onChange={(event)=>updatePreview("groom", event.currentTarget.files)} /></label></div><div className="upload-preview-grid"><figure className="upload-local-preview">{previews.bride ? <img src={previews.bride} alt="新娘正脸照预览" /> : <span>新娘正脸照预览</span>}<figcaption>新娘正脸照</figcaption></figure><figure className="upload-local-preview">{previews.groom ? <img src={previews.groom} alt="新郎正脸照预览" /> : <span>新郎正脸照预览</span>}<figcaption>新郎正脸照</figcaption></figure></div><label className="check-row"><input checked={authorized} onChange={(event)=>setAuthorized(event.target.checked)} type="checkbox" />我确认上传的是本人照片，或已获得照片中人物授权</label><label className="check-row"><input checked={understood} onChange={(event)=>setUnderstood(event.target.checked)} type="checkbox" />我理解生成结果为 AI 写真图，不等同于真实拍摄照片</label>{hint ? <p className="small auth-hint">{hint}</p> : null}{error ? <div className="error-box upload-error">{error}</div> : null}<button disabled={submitting || compressing || !canSubmit} type="submit"><Upload size={18} />{compressing ? "照片优化中..." : submitting ? "上传中..." : "上传并创建订单"}</button></form>;
}
