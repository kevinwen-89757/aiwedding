import { NextResponse } from "next/server";
import { parseXml, verifyNotifySign, buildXml } from "@/services/wechatPay";
import { appConfig } from "@/lib/config";
import { listLocalOrders, payLocalOrder } from "@/services/localStore";
import { generateOrderPreviews } from "@/services/generation";

export async function POST(request: Request) {
  const xml = await request.text();
  const data = parseXml(xml);

  const wx = appConfig.wechatPay;
  if (!wx?.apiKey) {
    return new NextResponse(buildXml({ return_code: "FAIL", return_msg: "配置错误" }), {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }

  if (!verifyNotifySign(data, wx.apiKey)) {
    return new NextResponse(buildXml({ return_code: "FAIL", return_msg: "签名验证失败" }), {
      status: 400,
      headers: { "Content-Type": "application/xml" },
    });
  }

  if (data.return_code !== "SUCCESS" || data.result_code !== "SUCCESS") {
    return new NextResponse(buildXml({ return_code: "SUCCESS" }), {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }

  const outTradeNo = data.out_trade_no;
  if (!outTradeNo) {
    return new NextResponse(buildXml({ return_code: "FAIL", return_msg: "缺少订单号" }), {
      status: 400,
      headers: { "Content-Type": "application/xml" },
    });
  }

  const kind = outTradeNo.startsWith("D") ? "deposit" : "selection";
  const orders = await listLocalOrders();
  const order = orders.find((o) => o.metadata?.[`wechat_trade_no_${kind}`] === outTradeNo);

  if (!order) {
    return new NextResponse(buildXml({ return_code: "FAIL", return_msg: "订单不存在" }), {
      status: 404,
      headers: { "Content-Type": "application/xml" },
    });
  }

  try {
    await payLocalOrder(order.id, kind, outTradeNo);

    if (kind === "deposit") {
      void (async () => {
        try {
          await generateOrderPreviews(order.id, { source: "admin" });
        } catch (error) {
          console.error("[auto-generation] failed after wechat deposit:", error);
        }
      })();
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "支付确认失败";
    return new NextResponse(buildXml({ return_code: "FAIL", return_msg: msg }), {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }

  return new NextResponse(buildXml({ return_code: "SUCCESS" }), {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}
