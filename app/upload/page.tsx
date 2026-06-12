import { UploadForm } from "@/components/UploadForm";
import { UploadSamples } from "@/components/UploadSamples";
export default function UploadPage() {
  return <main className="shell upload-page"><section className="page-head upload-head"><p className="eyebrow">Upload</p><h1>上传新娘和新郎正脸照</h1><p className="lead">请分别上传新娘、新郎清晰正脸照片。照片越清晰，人物融入画面的效果越自然。</p></section><section className="upload-layout"><div className="card upload-panel"><div className="requirements"><h2>照片要求</h2><ul className="list muted"><li>请分别上传新娘、新郎本人正脸照</li><li>单人、清晰、无遮挡</li><li>不要合照、侧脸、墨镜、严重美颜、低清截图</li><li>建议选择自然光、五官清楚的照片</li><li>如果照片不符合要求，生成效果可能不像本人</li></ul></div><UploadForm /><p className="small"><a href="/privacy">隐私说明</a></p></div><UploadSamples /></section></main>;
}
