import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();

  const token = request.nextUrl.searchParams.get("token");
  const adminToken = process.env.ADMIN_TOKEN ?? (process.env.NODE_ENV === "production" ? "" : "dev-admin-token");
  if (!token || !adminToken || token !== adminToken) return NextResponse.next();

  const cleanUrl = request.nextUrl.clone();
  cleanUrl.searchParams.delete("token");
  const response = NextResponse.redirect(cleanUrl);
  response.cookies.set("admin_token", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}

export const config = {
  matcher: "/admin/:path*"
};
