/**
 * 验证腾讯云 COS（S3 兼容）凭证是否可用
 * 运行前先设置环境变量：
 *   export S3_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com
 *   export S3_REGION=ap-guangzhou
 *   export S3_BUCKET=levin-1407101990
 *   export S3_ACCESS_KEY_ID=AKIDxxxx
 *   export S3_SECRET_ACCESS_KEY=xxxx
 * 然后：node test-cos.mjs
 */
import { S3Client, ListBucketsCommand, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT || "https://cos.ap-guangzhou.myqcloud.com";
const region = process.env.S3_REGION || "ap-guangzhou";
const bucket = process.env.S3_BUCKET || "levin-1407101990";
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  console.error("❌ 请先设置 S3_ACCESS_KEY_ID 和 S3_SECRET_ACCESS_KEY 环境变量");
  process.exit(1);
}

const client = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: false,
});

async function main() {
  // 1) 列出 bucket（验证密钥本身有效）
  try {
    const buckets = await client.send(new ListBucketsCommand({}));
    console.log("✅ 密钥有效！可访问的 bucket：", buckets.Buckets?.map(b => b.Name).join(", ") || "(空)");
  } catch (e) {
    console.log("❌ ListBuckets 失败：", e.message);
    return;
  }

  // 2) 列出目标 bucket 内的对象
  try {
    const objects = await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 10 }));
    console.log(`✅ bucket '${bucket}' 可访问，当前对象数：${objects.KeyCount ?? 0}`);
  } catch (e) {
    console.log("❌ ListObjects 失败：", e.message);
    console.log("   （可能是 bucket 不存在，或该密钥无此 bucket 权限）");
    return;
  }

  // 3) 上传 + 读取 + 删除 一个小测试文件，验证完整读写链路
  const testKey = `aiwedding-test/${Date.now()}.txt`;
  const testBody = Buffer.from("hello-cos");
  try {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: testKey, Body: testBody, ContentType: "text/plain" }));
    const got = await client.send(new GetObjectCommand({ Bucket: bucket, Key: testKey }));
    const bytes = await got.Body.transformToByteArray();
    const ok = Buffer.from(bytes).toString() === "hello-cos";
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
    console.log(ok ? `✅ 读写删除链路正常（测试文件已清理）` : `⚠️ 读回内容不一致`);
  } catch (e) {
    console.log("❌ 读写测试失败：", e.message);
    return;
  }

  console.log("\n🎉 全部通过，可以接入生产环境了！");
}

main();
