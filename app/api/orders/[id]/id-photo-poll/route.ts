import { NextResponse } from "next/server";
import { pollIdPhotoTasks } from "@/services/generation";
import { getLocalOrder } from "@/services/localStore";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const { id } = await context.params;
  const current = await getLocalOrder(id);
  if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  try {
    const results = await pollIdPhotoTasks(id);
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Poll ID photo failed" }, { status: 500 });
  }
}
