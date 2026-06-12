"use client";

import { useEffect, useState } from "react";

export function HomeCarousel({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0;

  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % images.length), 4200);
    return () => window.clearInterval(timer);
  }, [images.length]);

  function move(step: number) {
    setActive((index) => (index + step + images.length) % images.length);
  }

  if (!hasImages) {
    return <div className="hero-art" aria-label="AI 婚纱写真作品占位"><div className="hero-tags"><span>柔光婚纱预览</span><span>高级写真质感</span><span>选中后解锁原图</span></div></div>;
  }

  return (
    <div className="hero-carousel" aria-label="AI 婚纱写真作品轮播">
      {images.map((src, index) => (
        <img className={index === active ? "active" : ""} src={src} alt={`AI 婚纱写真展示 ${index + 1}`} key={src} />
      ))}
      {images.length > 1 ? (
        <>
          <button type="button" className="carousel-arrow carousel-arrow-prev" onClick={() => move(-1)} aria-label="上一张展示图">‹</button>
          <button type="button" className="carousel-arrow carousel-arrow-next" onClick={() => move(1)} aria-label="下一张展示图">›</button>
        </>
      ) : null}
      <div className="carousel-dots" aria-label="轮播图切换">
        {images.map((src, index) => <button type="button" className={index === active ? "active" : ""} onClick={() => setActive(index)} aria-label={`查看第 ${index + 1} 张展示图`} aria-current={index === active ? "true" : undefined} key={src} />)}
      </div>
    </div>
  );
}
