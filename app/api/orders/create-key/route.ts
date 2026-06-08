import { NextResponse } from "next/server";
import { createLocalOrder } from "@/services/localStore";
import { appConfig } from "@/lib/config";

/**
 * POST /api/orders/create-key
 * 创建订单（不传文件），返回 orderId。
 * 前端拿到 orderId 后再直传 COS，最后调用 confirm-upload。
 */
export async function POST(request: Request) {
  try {
    const { customerName, customerPhone, customerEmail, photoType, brideMime, groomMime } = await request.json();

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "请填写姓名" }, { status: 400 });
    }

    const order = await createLocalOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() ?? null,
      customerEmail: customerEmail?.trim() ?? null,
      photoType: photoType ?? "id_photo",
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("[orders/create-key] 失败:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建订单失败" }, { status: 500 });
  }
}
