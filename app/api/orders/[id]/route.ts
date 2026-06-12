import { NextResponse } from "next/server";
import { getLocalOrder } from "@/services/localStore";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const order = await getLocalOrder(id);
  return order ? NextResponse.json(order) : NextResponse.json({ error: "Order not found" }, { status: 404 });
}
