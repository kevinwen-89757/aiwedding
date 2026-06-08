import { NextResponse } from "next/server";
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import { appConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/admin/setup-cors?token=aiwedding-admin-2026-Kevin-9x7p
 *
 * GET: 查看当前 CORS 配置
 * POST: 设置 COS Bucket CORS，允许 aiwedding.space 直传
 */
export async function GET(request: Request) {
  return handleCors(request, "view");
}

export async function POST(request: Request) {
  return handleCors(request, "setup");
}

async function handleCors(request: Request, mode: "view" | "setup") {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (token !== appConfig.adminToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

    if (mode === "view") {
      try {
        const result = await s3Client.send(
          new GetBucketCorsCommand({ Bucket: appConfig.s3Bucket })
        );
        return NextResponse.json({
          ok: true,
          bucket: appConfig.s3Bucket,
          corsRules: result.CORSRules ?? [],
        });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("NoSuchCORSConfiguration") || errMsg.includes("CORS")) {
          return NextResponse.json({ ok: true, bucket: appConfig.s3Bucket, corsRules: [], note: "No CORS rules found" });
        }
        throw err;
      }
    }

    // mode === "setup"
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: appConfig.s3Bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: [
                "https://aiwedding.space",
                "https://www.aiwedding.space",
                "http://localhost:3000",
              ],
              AllowedMethods: ["PUT", "GET", "HEAD"],
              AllowedHeaders: [
                "Content-Type",
                "Content-Length",
                "x-amz-*",
                "x-amz-sdk-checksum-algorithm",
              ],
              ExposeHeaders: ["ETag", "x-amz-request-id"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );

    return NextResponse.json({ ok: true, bucket: appConfig.s3Bucket, message: "CORS 已配置，允许 aiwedding.space 浏览器直传 COS" });
  } catch (error) {
    console.error("[setup-cors] 失败:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
