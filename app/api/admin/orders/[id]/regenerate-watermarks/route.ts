import { NextResponse } from "next/server";
import { regenerateOrderWatermarks } from "@/services/generation";
import { getLocalOrder } from "@/services/localStore";
import { adminUnauthorized } from "@/lib/admin";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const order = await getLocalOrder(id);
  if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

  // 支持前端传入自定义水印参数
  let options: { text?: string; opacity?: number } | undefined;
  try {
    const body = await request.json();
    if (body.text || body.opacity !== undefined) {
      options = {};
      if (typeof body.text === "string" && body.text.trim()) options.text = body.text.trim();
      if (typeof body.opacity === "number" && body.opacity >= 0 && body.opacity <= 1) {
        options.opacity = Math.round(body.opacity * 100) / 100;
      }
    }
  } catch {
    // no body or invalid json, use defaults
  }

  const result = await regenerateOrderWatermarks(id, options);
  return NextResponse.json({ ok: true, ...result });
}
