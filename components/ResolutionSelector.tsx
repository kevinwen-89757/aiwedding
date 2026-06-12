"use client";

import { useState } from "react";

type Resolution = "1K" | "2K" | "4K";

export function ResolutionSelector({
  orderId,
  currentResolution,
}: {
  orderId: string;
  currentResolution?: Resolution | null;
}) {
  const [selected, setSelected] = useState<Resolution>(currentResolution ?? "1K");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_resolution", resolution: selected }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: "8px" }}>
      <p style={{ marginBottom: "6px", fontWeight: 500 }}>生成分辨率：</p>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        {(["1K", "2K", "4K"] as Resolution[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setSelected(r)}
            style={{
              padding: "4px 16px",
              borderRadius: "6px",
              border: selected === r ? "2px solid #333" : "1px solid #ccc",
              background: selected === r ? "#333" : "#fff",
              color: selected === r ? "#fff" : "#333",
              fontWeight: selected === r ? 700 : 400,
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {r}
          </button>
        ))}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "4px 14px",
            borderRadius: "6px",
            border: "1px solid #888",
            background: saving ? "#eee" : "#f5f5f5",
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: "13px",
          }}
        >
          {saving ? "保存中…" : "保存"}
        </button>
        {saved && <span style={{ color: "green", fontSize: "13px" }}>✓ 已保存</span>}
        {error && <span style={{ color: "red", fontSize: "13px" }}>{error}</span>}
      </div>
    </div>
  );
}
