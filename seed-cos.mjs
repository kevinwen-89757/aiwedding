import { readFileSync } from "node:fs";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT || "https://cos.ap-guangzhou.myqcloud.com";
const region = process.env.S3_REGION || "ap-guangzhou";
const bucket = process.env.S3_BUCKET || "aiwedding-1407101990";
const client = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
  forcePathStyle: false,
});

async function getJson(key) {
  try {
    const r = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return JSON.parse(await r.Body.transformToString());
  } catch (e) {
    return null;
  }
}
async function putJson(key, data) {
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: JSON.stringify(data, null, 2), ContentType: "application/json" }));
}

// 1) 迁移兑换码
const localCodes = JSON.parse(readFileSync("./data/redeem-codes.json", "utf8"));
const existingCodes = await getJson("data/redeem-codes.json");
if (existingCodes && existingCodes.codes && existingCodes.codes.length) {
  console.log("兑换码已存在于 COS（" + existingCodes.codes.length + " 个），跳过。");
} else {
  await putJson("data/redeem-codes.json", localCodes);
  console.log("已写入 " + localCodes.codes.length + " 个兑换码到 COS");
}

// 2) 初始化订单文件（若为空）
const existingOrders = await getJson("data/orders.json");
if (!existingOrders) {
  await putJson("data/orders.json", { orders: [] });
  console.log("已初始化 data/orders.json");
} else {
  const n = existingOrders.orders ? existingOrders.orders.length : 0;
  console.log("订单文件已存在（" + n + " 条），跳过初始化。");
}
