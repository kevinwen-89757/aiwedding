import { NextResponse } from "next/server";
import { createMockTradeNo } from "@/services/payment";
import { payLocalOrder } from "@/services/localStore";
export async function POST(request: Request) {
  const body = await request.json();
  if (!body.orderId || !["deposit", "selection"].includes(body.kind)) return NextResponse.json({ error: "orderId and kind are required" }, { status: 400 });
  try {
    const order = await payLocalOrder(body.orderId, body.kind, createMockTradeNo(body.kind));
    return order ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment failed" }, { status: 400 });
  }
}
