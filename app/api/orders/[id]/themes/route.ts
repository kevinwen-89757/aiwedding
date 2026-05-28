import { NextResponse } from "next/server";
import { saveLocalThemeSelection } from "@/services/localStore";
import { weddingThemes } from "@/services/prompts";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const themeIds: unknown[] = Array.isArray(body.themeIds) ? body.themeIds : [];
  const validIds = new Set(weddingThemes.map((theme) => theme.themeId));
  const selectedIds = themeIds.filter((themeId): themeId is string => typeof themeId === "string" && validIds.has(themeId));
  try {
    const order = await saveLocalThemeSelection(id, selectedIds);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ themeIds: order.selected_theme_ids });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Theme selection failed" }, { status: 400 });
  }
}
