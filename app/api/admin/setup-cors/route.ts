import { NextResponse } from "next/server";
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

    // Use COS XML API directly with fetch
    const bucket = appConfig.s3Bucket;
    const region = appConfig.s3Region;
    const endpoint = appConfig.s3Endpoint?.replace(/https?:\/\//, "");
    const host = `${bucket}.${endpoint}`;

    if (mode === "view") {
      try {
        const res = await fetch(`https://${host}/?cors`, {
          method: "GET",
          headers: {
            Host: host,
          },
        });
        const xml = await res.text();
        return NextResponse.json({ ok: true, bucket, xml, status: res.status });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ ok: false, bucket, error: errMsg });
      }
    }

    // mode === "setup"
    // Build COS CORS XML
    const corsXml = `<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://aiwedding.space</AllowedOrigin>
    <AllowedOrigin>https://www.aiwedding.space</AllowedOrigin>
    <AllowedOrigin>http://localhost:3000</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <ExposeHeader>x-amz-request-id</ExposeHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>`;

    // Calculate MD5
    const encoder = new TextEncoder();
    const data = encoder.encode(corsXml);
    const hashBuffer = await crypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const contentMd5 = btoa(String.fromCharCode(...hashArray));

    // Send PUT request to COS
    const res = await fetch(`https://${host}/?cors`, {
      method: "PUT",
      headers: {
        Host: host,
        "Content-Type": "application/xml",
        "Content-MD5": contentMd5,
        Authorization: `Bearer ${appConfig.s3AccessKeyId}:${appConfig.s3SecretAccessKey}`,
      },
      body: corsXml,
    });

    const responseText = await res.text();

    if (res.ok) {
      return NextResponse.json({
        ok: true,
        bucket,
        message: "CORS 已配置，允许 aiwedding.space 浏览器直传 COS",
      });
    } else {
      return NextResponse.json(
        { error: "COS API error", status: res.status, response: responseText },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[setup-cors] 失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
