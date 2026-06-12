import { appConfig, assertProductionConfig } from "@/lib/config";

export function adminUnauthorized(request: Request) {
  assertProductionConfig();
  const url = new URL(request.url);
  const cookieToken = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith("admin_token="))?.split("=")[1];
  const token = request.headers.get("x-admin-token") ?? url.searchParams.get("token") ?? cookieToken;
  return appConfig.adminToken && token === appConfig.adminToken ? null : new Response("Unauthorized", { status: 401 });
}

export function isAdminToken(token?: string | null) {
  assertProductionConfig();
  return Boolean(appConfig.adminToken && token === appConfig.adminToken);
}
