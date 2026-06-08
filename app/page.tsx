import Link from "next/link";
import { HomeCarousel } from "@/components/HomeCarousel";
import { HomeThemeShowcase } from "@/components/HomeThemeShowcase";
import { weddingThemes } from "@/services/prompts";

/* eslint-disable react/no-unescaped-entities */

function homeCarouselImages() {
  // 直接返回图片路径，不依赖 existsSync（Vercel 环境 process.cwd() 可能不准确）
  return [1, 2, 3, 4, 5, 6, 7].map((index) => `/carousel/slide-${index}.jpg`);
}

export default function HomePage() {
  const images = homeCarouselImages();
  return (
    <main>
      <section className="shell hero">
        <div>
          <p className="eyebrow">AI Wedding Studio</p>
          <h1>
            上传一张正脸照，
            <br />
            生成你的 AI 婚纱写真
          </h1>
          <p className="lead hero-lead">
            支付 ¥9.9（可抵扣正片费用），选择 2个喜欢的风格，
            <br />
            先看全部预览图，再选喜欢的买。
          </p>
          <div className="actions">
            <Link className="button" href="/upload">
              开始上传
            </Link>
            <Link className="button secondary" href="/orders">
              查询订单
            </Link>
          </div>
        </div>
        <HomeCarousel images={images} />
      </section>
      <section className="shell section">
        <h2>从上传到下载，流程清楚省心。</h2>
        <div className="grid">
          <article className="card step-card">
            <p className="eyebrow">Step 01</p>
            <h3>上传正脸照</h3>
            <p className="muted">
              上传清晰、无遮挡的单人正脸照片，作为 AI 写真生成参考。
            </p>
          </article>
          <article className="card step-card">
            <p className="eyebrow">Step 02</p>
            <h3>选择 2个主题，生成全部预览图</h3>
            <p className="muted">
              支付试看生成后，选择喜欢的风格，系统自动生成预览图。
            </p>
          </article>
          <article className="card step-card">
            <p className="eyebrow">Step 03</p>
            <h3>选中后付款下载</h3>
            <p className="muted">
              只购买喜欢的图片。支付后解锁对应无水印原图下载。
            </p>
          </article>
        </div>
      </section>
      <section className="shell section pain-section">
        <h2>为什么越来越多人选择 AI 婚纱写真？</h2>
        <p className="lead">
          很多人不是不想拍好看的照片，而是不想再经历一整天的折腾。
        </p>
        <div className="chat-grid">
          <article className="chat-card">
            <div className="chat-head">
              <span className="avatar">C</span>
              <span className="chat-name">顾客聊天</span>
            </div>
            <p className="chat-bubble">
              "天呐，我表姐拍婚纱照<strong>凌晨4点就起床化妆</strong>，一整天下来累到表情都僵了。"
            </p>
            <span className="pain-tag">不用早起妆造</span>
          </article>
          <article className="chat-card">
            <div className="chat-head">
              <span className="avatar">L</span>
              <span className="chat-name">朋友吐槽</span>
            </div>
            <p className="chat-bubble">
              "最怕<strong>花了一大笔钱</strong>，结果<strong>当天状态不好</strong>，笑不出来，拍完还只能硬选。"
            </p>
            <span className="pain-tag">不用赌拍摄状态</span>
          </article>
          <article className="chat-card">
            <div className="chat-head">
              <span className="avatar">M</span>
              <span className="chat-name">选片之后</span>
            </div>
            <p className="chat-bubble">
              "选片的时候才发现，喜欢的都要<strong>另外加钱</strong>，不加又觉得白拍了。"
            </p>
            <span className="pain-tag">不用被加片绑架</span>
          </article>
          <article className="chat-card">
            <div className="chat-head">
              <span className="avatar">Y</span>
              <span className="chat-name">真实想法</span>
            </div>
            <p className="chat-bubble">
              "我更喜欢先看到效果，真的喜欢再买，不想还没看到照片就<strong>先付一大笔</strong>。"
            </p>
            <span className="pain-tag">先看结果，再决定买不买</span>
          </article>
        </div>
      </section>
      <section id="pricing" className="shell section">
        <h2>先试看，再决定买哪张。</h2>
        <div className="grid">
          <article className="card price-card">
            <h3>试看生成</h3>
            <p className="price">¥9.9</p>
            <p className="muted">
              支付后可看全部预览图，不满意可不买。
              <br />
              ¥9.9 试看费可在选购正片时全额抵扣。
            </p>
          </article>
          <article className="card price-card">
            <h3>单张购买</h3>
            <p className="price">¥59.9 / 张</p>
            <p className="muted">
              只为选中的图片付款，支付后下载无水印原图。
              <br />满 8 张免 1 张。
            </p>
          </article>
          <article className="card price-card">
            <h3>选中才付费</h3>
            <p className="price">0压力</p>
            <p className="muted">不满意可不买，预览阶段不强制购买原图。</p>
          </article>
        </div>
      </section>
      <section id="style-preview" className="shell section home-theme-section">
        <p className="eyebrow">Style preview</p>
        <h2>看看你可以解锁哪些婚纱写真风格</h2>
        <p className="lead">先预览风格样片，再上传正脸照生成专属预览。</p>
        <HomeThemeShowcase themes={weddingThemes} />
      </section>
      <p className="muted" style={{ textAlign: "center", marginTop: 16 }}>
        <Link href="/orders">查询订单</Link>
      </p>
    </main>
  );
}
