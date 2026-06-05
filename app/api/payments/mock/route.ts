import { NextResponse } from "next/server";
import { createMockTradeNo } from "@/services/payment";
import { payLocalOrder } from "@/services/localStore";
import { generateOrderPreviews } from "@/services/generation";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.orderId || !["deposit", "selection"].includes(body.kind)) return NextResponse.json({ error: "orderId and kind are required" }, { status: 400 });
  try {
    const order = await payLocalOrder(body.orderId, body.kind, createMockTradeNo(body.kind));
    // 定金支付成功后自动开始 AI 生成（fire-and-forget，不阻塞支付响应）
    if (order && body.kind === "deposit") {
      void (async () => {
        try {
          await generateOrderPreviews(body.orderId, { source: "admin" });
        } catch (error) {
          console.error("[auto-generation] failed after deposit payment:", error);
        }
      })();
    }
    return order ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment failed" }, { status: 400 });
  }
}
