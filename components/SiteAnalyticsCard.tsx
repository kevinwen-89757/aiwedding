"use client";
import { useEffect, useState } from "react";

export function SiteAnalyticsCard() {
  const [data, setData] = useState<{ today: number; week: number; month: number; hourly: Record<number, number> } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setData(d);
        else setError(d.error || "统计加载失败");
      })
      .catch(() => setError("统计加载失败"));
  }, []);

  if (error) {
    return (
      <section style={{ marginBottom: 32, padding: "16px 20px", background: "#fef3c7", borderRadius: 12, border: "1px solid #fde68a" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>📊 站点访问统计</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>{error}（如需启用统计，请在 Supabase 中创建 site_visits 表）</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section style={{ marginBottom: 32, padding: "16px 20px", background: "#f8f6f3", borderRadius: 12, border: "1px solid #e8e3dc" }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>📊 站点访问统计</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#666" }}>加载中...</p>
      </section>
    );
  }

  const maxHourly = Math.max(...Object.values(data.hourly), 1);

  return (
    <section style={{ marginBottom: 32, padding: "16px 20px", background: "#f8f6f3", borderRadius: 12, border: "1px solid #e8e3dc" }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>📊 站点访问统计</h2>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#666" }}>今日访问</p>
          <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: "#059669" }}>{data.today}</p>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#666" }}>近7天</p>
          <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: "#2563eb" }}>{data.week}</p>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#666" }}>近30天</p>
          <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: "#7c3aed" }}>{data.month}</p>
        </div>
      </div>
      {/* Hourly bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 60, paddingTop: 8, borderTop: "1px solid #e8e3dc" }}>
        {Array.from({ length: 24 }, (_, i) => {
          const count = data.hourly[i] || 0;
          const height = count > 0 ? Math.max(4, (count / maxHourly) * 56) : 2;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }} title={`${i}:00 - ${count} 次`}>
              <div style={{ width: "100%", height, background: count > 0 ? "#059669" : "#e5e7eb", borderRadius: 2, minHeight: 2 }} />
              {i % 4 === 0 ? <span style={{ fontSize: 9, color: "#888" }}>{i}</span> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
