import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { appConfig } from "@/lib/config";
import { getLocalOrder } from "@/services/localStore";
import { generateOrderPreviews, getGenerationRuntimeConfig, getReferenceUploadAssets } from "@/services/generation";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const order = await getLocalOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const isForce = body?.force === true;

  if (isForce) {
    // 强制重试：允许 generating/generation_failed/failed 状态重新启动
    if (order.status !== "generating" && order.status !== "generation_failed" && order.status !== "failed") {
      return NextResponse.json({ error: `当前状态 ${order.status} 不需要强制重试。` }, { status: 409 });
    }
  } else {
    // 正常启动：仅允许 ready_to_generate
    if (order.status !== "ready_to_generate") {
      return NextResponse.json({ error: `当前状态 ${order.status} 不允许启动生成，仅 ready_to_generate 可触发。` }, { status: 409 });
    }
  }
  const references = getReferenceUploadAssets(order);
  const runtimeConfig = getGenerationRuntimeConfig(order);
  console.log("[start-generation] api precheck", {
    orderId: id,
    status: order.status,
    hasBridePhoto: Boolean(references.bride),
    hasGroomPhoto: Boolean(references.groom),
    selectedThemeIds: order.selected_theme_ids,
    generationMode: appConfig.generationMode,
    provider: appConfig.generationProvider,
    hasApiKey: Boolean(process.env.APIMART_API_KEY),
    testLimit: runtimeConfig.generationTestLimit,
    effectiveLimit: runtimeConfig.effectiveLimit,
    planLength: runtimeConfig.planLength,
    resolution: runtimeConfig.apimartResolution,
    timeoutMs: runtimeConfig.apimartTimeoutMs,
    plannedTaskCount: runtimeConfig.plannedTaskCount,
    generationJobsCount: order.generation_jobs?.length ?? 0,
    generatedAssetsCount: order.order_assets.filter((asset) => asset.kind === "generated").length
  });
  try {
    await generateOrderPreviews(id, { source: "admin" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 });
  }
}
