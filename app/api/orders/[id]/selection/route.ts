import { NextResponse } from "next/server";
import { saveLocalSelection } from "@/services/localStore";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const order = await saveLocalSelection(id, Array.isArray(body.assetIds) ? body.assetIds : []);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ selectedCount: order.selected_count, amountCents: order.selection_amount_cents });
}
