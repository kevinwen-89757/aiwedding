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
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div ref={ref} className="wechat-contact">
      <button className="wechat-btn" onClick={() => setOpen(!open)}>
        <svg className="wechat-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        客服微信
      </button>
      {open && (
        <div className="wechat-popup">
          <div className="wechat-popup-inner">
            <div className="wechat-popup-head">
              <svg className="wechat-logo" viewBox="0 0 24 24" width="36" height="36" fill="#07C160">
                <rect width="24" height="24" rx="6" fill="#07C160" />
                <path d="M17.5 13.5c0 2.5-3 4.5-6.5 4.5-1 0-2-.2-2.8-.5L5 18.5l1-3.5c-.6-1-.9-2-.9-3 0-2.5 3-4.5 6.4-4.5s6.5 2 6.5 4.5z" fill="#fff" />
                <circle cx="9" cy="12" r="1" fill="#07C160" />
                <circle cx="13" cy="12" r="1" fill="#07C160" />
              </svg>
              <div>
                <p className="wechat-popup-title">添加微信咨询</p>
                <p className="wechat-popup-sub">1对1客服，快速响应</p>
              </div>
            </div>
            <div className="wechat-popup-id-box">
              <span className="wechat-popup-label">微信号</span>
              <span className="wechat-popup-id">CyberSunset_K</span>
            </div>
            <button className="wechat-popup-copy" onClick={copy}>
              {copied ? "已复制到剪贴板" : "复制微信号"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
