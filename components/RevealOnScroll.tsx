"use client";
import { useEffect } from "react";

const revealSelector = [
  "main > section",
  ".card",
  ".theme-card",
  ".photo-tile",
  ".sample-card",
  ".table-wrap",
  ".hero-carousel",
  ".upload-local-preview"
].join(",");

export function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
    elements.forEach((element, index) => {
      element.classList.add("reveal-item");
      element.style.setProperty("--reveal-delay", `${Math.min((index % 6) * 60, 300)}ms`);
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return null;
}
