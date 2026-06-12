import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { completeManualGeneration } from "@/services/generation";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  try {
    await completeManualGeneration(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Complete generation failed" }, { status: 400 });
  }
}
