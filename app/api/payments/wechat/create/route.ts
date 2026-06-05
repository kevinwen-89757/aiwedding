import { NextResponse } from "next/server";
import { unifiedOrder } from "@/services/wechatPay";
import { getLocalOrder, updateLocalOrder } from "@/services/localStore";
import { appConfig } from "@/lib/config";

export async function POST(request: Request) {
  const body = await request.json();
  const { orderId, kind } = body;
  if (!orderId || !["deposit", "selection"].includes(kind)) {
    return NextResponse.json({ error: "orderId and kind are required" }, { status: 400 });
  }

  const order = await getLocalOrder(orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const amount = kind === "deposit" ? order.deposit_amount_cents : order.selection_amount_cents;
  if (amount <= 0) return NextResponse.json({ error: "No payable amount" }, { status: 400 });

  const wx = appConfig.wechatPay;
  if (!wx?.appId || !wx?.mchId || !wx?.apiKey) {
    return NextResponse.json({ error: "微信支付未配置" }, { status: 500 });
  }

  const outTradeNo = `${kind === "deposit" ? "D" : "S"}${Date.now()}${orderId.slice(0, 6)}`;

  await updateLocalOrder(orderId, (o) => {
    o.metadata = { ...(o.metadata || {}), [`wechat_trade_no_${kind}`]: outTradeNo };
    return o;
  });

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "127.0.0.1";

  try {
    const result = await unifiedOrder({
      appId: wx.appId,
      mchId: wx.mchId,
      apiKey: wx.apiKey,
      body: kind === "deposit" ? "AI婚纱照-试看费" : "AI婚纱照-选片费",
      outTradeNo,
      totalFee: amount,
      spbillCreateIp: clientIp,
      notifyUrl: `${appConfig.appUrl}/api/payments/wechat/notify`,
    });

    if (result.returnCode !== "SUCCESS" || result.resultCode !== "SUCCESS") {
      return NextResponse.json({ error: result.returnMsg || "统一下单失败" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, codeUrl: result.codeUrl, outTradeNo });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "统一下单失败" }, { status: 500 });
  }
}
