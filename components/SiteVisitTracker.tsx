"use client";
import { useEffect } from "react";

export function SiteVisitTracker({ page = "home" }: { page?: string }) {
  useEffect(() => {
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ page }),
    }).catch(() => {
      // Silently fail - analytics are non-critical
    });
  }, [page]);
  return null;
}
