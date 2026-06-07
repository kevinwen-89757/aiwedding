import { NextResponse } from "next/server";
import { regenerateOrderWatermarks } from "@/services/generation";
import { getLocalOrder } from "@/services/localStore";
import { adminUnauthorized } from "@/lib/admin";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const order = await getLocalOrder(id);
  if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

  const result = await regenerateOrderWatermarks(id);
  return NextResponse.json({ ok: true, ...result });
}
