import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { uploadManualGeneratedResults } from "@/services/generation";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const formData = await request.formData();
  const files = formData.getAll("images").filter((file): file is File => file instanceof File && file.size > 0);
  if (files.length < 1) return NextResponse.json({ error: "请选择至少 1 张图片" }, { status: 400 });
  try {
    const result = await uploadManualGeneratedResults(id, files);
    return NextResponse.json({
      ok: true,
      uploadedCount: result.uploadedCount,
      planCount: result.planCount,
      message: result.message ?? `已上传 ${result.uploadedCount} 张，已自动生成水印预览。`
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
