import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { getGenerationRuntimeConfig, pollApiGeneration } from "@/services/generation";
import { getLocalOrder } from "@/services/localStore";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  try {
    const current = await getLocalOrder(id);
    const runtimeConfig = current ? getGenerationRuntimeConfig(current) : null;
    console.log("[poll-generation] api precheck", {
      orderId: id,
      status: current?.status,
      effectiveLimit: runtimeConfig?.effectiveLimit,
      planLength: runtimeConfig?.planLength,
      plannedTaskCount: runtimeConfig?.plannedTaskCount,
      resolution: runtimeConfig?.apimartResolution,
      timeoutMs: runtimeConfig?.apimartTimeoutMs,
      generationJobsCount: current?.generation_jobs?.length ?? 0,
      generatedAssetsCount: current?.order_assets.filter((asset) => asset.kind === "generated").length ?? 0
    });
    const order = await pollApiGeneration(id);
    return NextResponse.json({
      ok: true,
      status: order?.status,
      generatedCount: order?.order_assets.filter((asset) => asset.kind === "generated").length ?? 0,
      pendingCount: order?.generation_jobs?.filter((job) => job.status !== "completed" && job.status !== "failed").length ?? 0,
      generationJobsCount: order?.generation_jobs?.length ?? 0
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Poll generation failed" }, { status: 500 });
  }
}
