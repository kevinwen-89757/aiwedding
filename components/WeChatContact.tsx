"use client";

import { useState, useRef, useEffect } from "react";

export default function WeChatContact() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function copy() {
    navigator.clipboard.writeText("CyberSunset_K");
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1200);
  }

  return (
    <div ref={ref} className="wechat-contact">
      <button
        className="wechat-contact-btn"
        onClick={() => setOpen(!open)}
      >
        客服微信
      </button>
      {open && (
        <div className="wechat-contact-popup">
          <p className="wechat-contact-label">微信号</p>
          <p className="wechat-contact-id">CyberSunset_K</p>
          <button
            className="wechat-contact-copy"
            onClick={copy}
          >
            {copied ? "已复制" : "复制微信号"}
          </button>
        </div>
      )}
    </div>
  );
}
