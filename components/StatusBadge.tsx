import type { OrderStatus } from "@/lib/types";
import { getStatusText, normalizeStatus } from "@/lib/status";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status ${normalizeStatus(status)}`}>{getStatusText(status)}</span>;
}
