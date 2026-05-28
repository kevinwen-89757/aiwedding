import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { confirmLocalPayment, getLocalOrder, updateLocalOrderStatus } from "@/services/localStore";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  const body = await request.json();
  const current = await getLocalOrder(id);
  if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (body.action === "confirm_deposit") {
    await confirmLocalPayment(id, "deposit");
    return NextResponse.json({ ok: true });
  }
  if (body.action === "confirm_selection") {
    await confirmLocalPayment(id, "selection");
    return NextResponse.json({ ok: true });
  }
  const order = await updateLocalOrderStatus(id, body.status ?? current.status, { admin_note: body.adminNote ?? null, reject_reason: body.rejectReason ?? null });
  return order ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Order not found" }, { status: 404 });
}
