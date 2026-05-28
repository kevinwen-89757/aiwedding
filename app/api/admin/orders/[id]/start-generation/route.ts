import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { appConfig } from "@/lib/config";
import { getLocalOrder } from "@/services/localStore";
import { generateOrderPreviews, getReferenceUploadAssets } from "@/services/generation";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const order = await getLocalOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const references = getReferenceUploadAssets(order);
  console.log("[start-generation] api precheck", {
    orderId: id,
    status: order.status,
    hasBridePhoto: Boolean(references.bride),
    hasGroomPhoto: Boolean(references.groom),
    selectedThemeIds: order.selected_theme_ids,
    generationMode: appConfig.generationMode,
    provider: appConfig.generationProvider,
    hasApiKey: Boolean(process.env.APIMART_API_KEY),
    testLimit: process.env.GENERATION_TEST_LIMIT
  });
  try {
    await generateOrderPreviews(id, { source: "admin" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 });
  }
}
