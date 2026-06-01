"use client";

import { useState, useRef, useEffect } from "react";

export default function WeChatContact() {
  const [open, setOpen] = useState(false);
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
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          color: "var(--muted)",
          fontFamily: "inherit",
          padding: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
      >
        客服微信
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "14px 18px",
            boxShadow: "0 8px 32px rgba(0,0,0,.12)",
            zIndex: 100,
            whiteSpace: "nowrap",
            minWidth: 200,
          }}
        >
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--muted)" }}>
            微信号
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>
            CyberSunset_K
          </p>
          <button
            onClick={copy}
            style={{
              width: "100%",
              padding: "6px 0",
              border: "1px solid var(--line)",
              borderRadius: 8,
              background: "var(--bg)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "inherit",
              color: "var(--ink)",
            }}
          >
            复制微信号
          </button>
        </div>
      )}
    </div>
  );
}
