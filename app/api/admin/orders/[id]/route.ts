import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { confirmLocalPayment, deleteLocalOrder, getLocalOrder, updateLocalOrder, updateLocalOrderStatus } from "@/services/localStore";
import { generateIdPhotoTasks, generateOrderPreviews } from "@/services/generation";
type Context = { params: Promise<{ id: string }> };
export async function DELETE(request: Request, context: Context) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const current = await getLocalOrder(id);
  if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  await deleteLocalOrder(id);
  return NextResponse.json({ ok: true });
}
export async function PATCH(request: Request, context: Context) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const body = await request.json();
  const current = await getLocalOrder(id);
  if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (body.action === "confirm_deposit") {
    await confirmLocalPayment(id, "deposit");
    // 确认定金后自动开始婚纱照生成
    void (async () => {
      try { await generateOrderPreviews(id, { source: "admin" }); } catch (e) { console.error("[auto-generation] failed:", e); }
    })();
    // 如果用户上传的是生活照，自动创建证件照生成任务
    if (current.photo_type === "casual_photo") {
      void (async () => {
        try { await generateIdPhotoTasks(id); } catch (e) { console.error("[id-photo-generation] failed:", e); }
      })();
    }
    return NextResponse.json({ ok: true });
  }
  if (body.action === "confirm_selection") {
    await confirmLocalPayment(id, "selection");
    return NextResponse.json({ ok: true });
  }
  if (body.action === "force_release") {
    if (current.status !== "generating") {
      return NextResponse.json({ error: "只有生成中的订单才能强制上线" }, { status: 400 });
    }
    await updateLocalOrder(id, (order) => {
      order.status = "pending_selection";
      order.generation_jobs = (order.generation_jobs ?? []).map((job) =>
        job.status === "created" || job.status === "polling"
          ? { ...job, status: "failed", error: "管理员强制上线，未完成任务已舍弃", updated_at: new Date().toISOString() }
          : job
      );
      const notePrefix = order.admin_note ? order.admin_note + "\n" : "";
      order.admin_note = `${notePrefix}[${new Date().toISOString()}] 管理员强制上线：订单状态从 generating → pending_selection，未完成任务已标记为失败。`;
      return order;
    });
    return NextResponse.json({ ok: true, released: true });
  }
  const order = await updateLocalOrderStatus(id, body.status ?? current.status, { admin_note: body.adminNote ?? null, reject_reason: body.rejectReason ?? null });
  return order ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Order not found" }, { status: 404 });
}
