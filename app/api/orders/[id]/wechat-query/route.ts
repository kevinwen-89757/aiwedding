import { NextResponse } from "next/server";
import { getLocalOrder } from "@/services/localStore";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") === "selection" ? "selection" : "deposit";

  const order = await getLocalOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const paid = order.payments.some((p) => p.kind === kind && p.status === "paid");
  return NextResponse.json({ ok: true, paid, status: order.status });
}
