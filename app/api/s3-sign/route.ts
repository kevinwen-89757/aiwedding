import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { appConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * POST /api/s3-sign
 * Body: { files: Record<string, string> }  // { relativePath: mimeType, ... }
 * Returns: { urls: Record<string, string> }  // { relativePath: presignedUrl, ... }
 *
 * 生成 S3 PUT 预签名 URL（有效期 10 分钟），
 * 供浏览器直传 COS，绕过 Vercel 10s 函数超时。
 */
export async function POST(request: Request) {
  try {
    const { files } = (await request.json()) as { files?: Record<string, string> };
    if (!files || typeof files !== "object") {
      return NextResponse.json({ error: "files 格式错误，应为 { relativePath: mimeType } 的对象" }, { status: 400 });
    }

    const entries = Object.entries(files);
    if (entries.length === 0) {
      return NextResponse.json({ error: "files 不能为空" }, { status: 400 });
    }

    const s3Client = new S3Client({
      region: appConfig.s3Region,
      endpoint: appConfig.s3Endpoint,
      credentials: {
        accessKeyId: appConfig.s3AccessKeyId!,
        secretAccessKey: appConfig.s3SecretAccessKey!,
      },
      forcePathStyle: false,
    });

    const urls: Record<string, string> = {};
    for (const [key, mimeType] of entries) {
      const command = new PutObjectCommand({
        Bucket: appConfig.s3Bucket,
        Key: key,
        ContentType: mimeType || "application/octet-stream",
      });
      urls[key] = await getSignedUrl(s3Client, command, { expiresIn: 600 });
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("[s3-sign] 生成预签名 URL 失败:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
