"use client";
import { useEffect } from "react";

export function SelectionViewTracker({ orderId }: { orderId: string }) {
  useEffect(() => {
    fetch(`/api/orders/${orderId}/track-selection-view`, { method: "POST" }).catch(() => {});
  }, [orderId]);
  return null;
}
