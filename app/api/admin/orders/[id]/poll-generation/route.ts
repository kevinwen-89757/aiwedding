import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { pollApiGeneration } from "@/services/generation";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  try {
    const order = await pollApiGeneration(id);
    return NextResponse.json({
      ok: true,
      status: order?.status,
      generatedCount: order?.order_assets.filter((asset) => asset.kind === "generated").length ?? 0,
      pendingCount: order?.generation_jobs?.filter((job) => job.status !== "completed" && job.status !== "failed").length ?? 0
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Poll generation failed" }, { status: 500 });
  }
}
