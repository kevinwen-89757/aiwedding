"use client";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PreviewState = {
  bride: string;
  groom: string;
};

export function UploadForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [understood, setUnderstood] = useState(false);
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
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const bridePhoto = form.get("bridePhoto");
    const groomPhoto = form.get("groomPhoto");
    const hasBride = bridePhoto instanceof File && bridePhoto.size > 0;
    const hasGroom = groomPhoto instanceof File && groomPhoto.size > 0;
    if (!hasBride && !hasGroom) { setError("请分别上传新娘和新郎正脸照"); return; }
    if (!hasBride) { setError("请上传新娘正脸照"); return; }
    if (!hasGroom) { setError("请上传新郎正脸照"); return; }
    if (!authorized || !understood) { setError("请先勾选两项隐私授权与 AI 生成说明。"); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", { method: "POST", body: form });
      const payload = await response.json().catch(() => ({ error: "服务器没有返回可读错误信息" }));
      setSubmitting(false);
      if (!response.ok) { setError(payload.error ?? `上传失败，状态码 ${response.status}`); return; }
      router.push(`/orders/${payload.orderId}/pay?kind=deposit`);
    } catch (err) { setSubmitting(false); setError(err instanceof Error ? err.message : "上传失败，请查看终端日志"); }
  }
  const hasBothPhotos = Boolean(previews.bride && previews.groom);
  const hasConsent = authorized && understood;
  const canSubmit = hasBothPhotos && hasConsent;
  const hint = !hasBothPhotos ? "请分别上传新娘和新郎正脸照。" : !hasConsent ? "请勾选两项授权后继续。" : "";
  return <form className="form upload-form" onSubmit={onSubmit}><div className="form-row"><label>姓名 / 订单备注<input name="customerName" placeholder="用于后台识别订单" /></label><label>手机<input name="customerPhone" placeholder="可选" /></label></div><div className="upload-file-row"><label className="upload-file-control">新娘正脸照<input name="bridePhoto" type="file" accept="image/png,image/jpeg,image/webp" required onChange={(event)=>updatePreview("bride", event.currentTarget.files)} /></label><label className="upload-file-control">新郎正脸照<input name="groomPhoto" type="file" accept="image/png,image/jpeg,image/webp" required onChange={(event)=>updatePreview("groom", event.currentTarget.files)} /></label></div><div className="upload-preview-grid"><figure className="upload-local-preview">{previews.bride ? <img src={previews.bride} alt="新娘正脸照预览" /> : <span>新娘正脸照预览</span>}<figcaption>新娘正脸照</figcaption></figure><figure className="upload-local-preview">{previews.groom ? <img src={previews.groom} alt="新郎正脸照预览" /> : <span>新郎正脸照预览</span>}<figcaption>新郎正脸照</figcaption></figure></div><label className="check-row"><input checked={authorized} onChange={(event)=>setAuthorized(event.target.checked)} type="checkbox" />我确认上传的是本人照片，或已获得照片中人物授权</label><label className="check-row"><input checked={understood} onChange={(event)=>setUnderstood(event.target.checked)} type="checkbox" />我理解生成结果为 AI 写真图，不等同于真实拍摄照片</label>{hint ? <p className="small auth-hint">{hint}</p> : null}{error ? <div className="error-box">{error}</div> : null}<button disabled={submitting || !canSubmit} type="submit"><Upload size={18} />{submitting ? "上传中..." : "上传并创建订单"}</button></form>;
}
