import { NextResponse } from "next/server";
import { pollApiGeneration } from "@/services/generation";
import { getLocalOrder } from "@/services/localStore";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const { id } = await context.params;
  const current = await getLocalOrder(id);
  if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (current.status !== "generating" || !current.generation_jobs?.length) {
    return NextResponse.json({
      ok: true,
      status: current.status,
      generatedCount: current.order_assets.filter((asset) => asset.kind === "generated").length
    });
  }
  try {
    const order = await pollApiGeneration(id);
    return NextResponse.json({
      ok: true,
      status: order?.status,
      generatedCount: order?.order_assets.filter((asset) => asset.kind === "generated").length ?? 0
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Poll generation failed" }, { status: 500 });
  }
}
