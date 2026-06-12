import { NextResponse } from "next/server";
import { adminUnauthorized } from "@/lib/admin";
import { listLocalOrders } from "@/services/localStore";
export async function GET(request: Request) {
  const unauthorized = adminUnauthorized(request);
  if (unauthorized) return unauthorized;
  return NextResponse.json(await listLocalOrders());
}
