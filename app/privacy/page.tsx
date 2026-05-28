export default function PrivacyPage() {
  return (
    <main className="narrow section">
      <div className="card">
        <p className="eyebrow">Privacy</p>
        <h1>隐私说明</h1>
        <ul className="list muted">
          <li>用户上传的新娘、新郎照片仅用于本次 AI 婚纱写真生成，不会公开展示。</li>
          <li>未经授权不会公开展示用户照片或生成结果。</li>
          <li>用户可联系商家删除照片和生成结果。</li>
          <li>生成结果为 AI 写真图，不等同于真实拍摄照片。</li>
          <li>用户应确认上传的是本人照片，或已获得照片中人物授权。</li>
        </ul>
      </div>
    </main>
  );
}
