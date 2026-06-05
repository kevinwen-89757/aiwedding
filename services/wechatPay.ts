import { createHash, randomBytes } from "node:crypto";

function md5(str: string): string {
  return createHash("md5").update(str, "utf8").digest("hex").toUpperCase();
}

function buildSign(params: Record<string, string>, apiKey: string): string {
  const keys = Object.keys(params)
    .filter((k) => k !== "sign" && params[k] !== undefined && params[k] !== "")
    .sort();
  const stringA = keys.map((k) => `${k}=${params[k]}`).join("&");
  return md5(`${stringA}&key=${apiKey}`);
}

export function buildXml(params: Record<string, string>): string {
  let xml = "<xml>";
  for (const [key, value] of Object.entries(params)) {
    xml += `<${key}><![CDATA[${value}]]></${key}>`;
  }
  xml += "</xml>";
  return xml;
}

export function parseXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /<(\w+)>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/\1>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

export function generateNonceStr(): string {
  return randomBytes(16).toString("hex");
}

export async function unifiedOrder(params: {
  appId: string;
  mchId: string;
  apiKey: string;
  body: string;
  outTradeNo: string;
  totalFee: number;
  spbillCreateIp: string;
  notifyUrl: string;
}): Promise<{
  returnCode: string;
  returnMsg?: string;
  resultCode?: string;
  codeUrl?: string;
}> {
  const nonceStr = generateNonceStr();
  const reqParams: Record<string, string> = {
    appid: params.appId,
    mch_id: params.mchId,
    nonce_str: nonceStr,
    body: params.body,
    out_trade_no: params.outTradeNo,
    total_fee: String(params.totalFee),
    spbill_create_ip: params.spbillCreateIp,
    notify_url: params.notifyUrl,
    trade_type: "NATIVE",
  };
  reqParams.sign = buildSign(reqParams, params.apiKey);

  const res = await fetch("https://api.mch.weixin.qq.com/pay/unifiedorder", {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: buildXml(reqParams),
  });
  const resXml = await res.text();
  const data = parseXml(resXml);

  return {
    returnCode: data.return_code,
    returnMsg: data.return_msg,
    resultCode: data.result_code,
    codeUrl: data.code_url,
  };
}

export function verifyNotifySign(data: Record<string, string>, apiKey: string): boolean {
  const sign = data.sign;
  if (!sign) return false;
  const calculated = buildSign(data, apiKey);
  return calculated === sign;
}
