import { NextResponse } from "next/server";
import { getLocalOrder, updateLocalOrder } from "@/services/localStore";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const { id } = await context.params;
  const order = await getLocalOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const currentViews = (order.metadata?.selection_page_views as number) || 0;
  await updateLocalOrder(id, (current) => ({
    ...current,
    metadata: {
      ...current.metadata,
      selection_page_views: currentViews + 1,
    },
  }));

  return NextResponse.json({ ok: true, views: currentViews + 1 });
}
