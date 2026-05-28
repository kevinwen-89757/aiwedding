import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { getLocalOrder } from "@/services/localStore";
import { buildOrderInfo, formatGenerationPrompts } from "@/services/generation";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const order = await getLocalOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const upload = order.order_assets.find((asset) => asset.kind === "upload");
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "json") return NextResponse.json(buildOrderInfo(order));
  return new NextResponse(formatGenerationPrompts(order, upload), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="prompts-${order.id}.txt"`
    }
  });
}
