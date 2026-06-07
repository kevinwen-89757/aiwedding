"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { DeleteOrderButton } from "./DeleteOrderButton";
import { StatusBadge } from "./StatusBadge";
import { formatCny } from "@/lib/money";
import type { LocalOrder } from "@/services/localStore";

type OrderRow = {
  id: string;
  shortId: string;
  customerName: string;
  status: LocalOrder["status"];
  themes: string;
  selectedCount: number;
  selectionAmount: number;
  createdAt: string;
};

export function AdminOrdersTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const someSelected = selected.size > 0 && selected.size < orders.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function batchDelete() {
    if (selected.size === 0) return;
    const names = orders.filter((o) => selected.has(o.id)).map((o) => o.shortId).join(", ");
    if (!window.confirm(`确定要批量删除 ${selected.size} 个订单吗？\n\n订单号：${names}\n\n删除后无法恢复，请确认这些都不是真实顾客订单。`)) return;
    setDeleting(true);
    const ids = Array.from(selected);
    const results = await Promise.allSettled(
      ids.map((id) => fetch(`/api/admin/orders/${id}`, { method: "DELETE" }).then((r) => ({ id, ok: r.ok })))
    );
    const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok));
    if (failed.length > 0) {
      alert(`批量删除完成：成功 ${ids.length - failed.length} 个，失败 ${failed.length} 个。`);
    }
    setSelected(new Set());
    setDeleting(false);
    router.refresh();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected; }} onChange={toggleSelectAll} style={{ flexShrink: 0, width: 16, height: 16, accentColor: "#a0845c" }} />
          <span>全选（共 {orders.length} 个订单）</span>
        </label>
        {selected.size > 0 && (
          <button
            className="button danger"
            onClick={batchDelete}
            disabled={deleting}
            style={{ background: "#dc2626", color: "#fff", border: "none", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
          >
            <Trash2 size={14} />
            {deleting ? "删除中…" : `批量删除 ${selected.size} 个订单`}
          </button>
        )}
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>订单</th>
              <th>客户</th>
              <th>状态</th>
              <th>已选主题</th>
              <th>选片数量</th>
              <th>订单金额</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleOne(order.id)} />
                </td>
                <td>{order.shortId}</td>
                <td>{order.customerName}</td>
                <td><StatusBadge status={order.status} /></td>
                <td>{order.themes}</td>
                <td>{order.selectedCount} 张</td>
                <td>{formatCny(order.selectionAmount)}</td>
                <td>{order.createdAt}</td>
                <td style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Link className="button secondary" href={`/admin/orders/${order.id}`}>查看</Link>
                  <DeleteOrderButton orderId={order.id} orderShort={order.shortId} variant="row" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
