import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_BASE_PATH, ADMIN_COOKIE, verifySessionToken } from "@/lib/server/admin-auth";

/**
 * Guards the hidden admin area. Unauthenticated visitors to any admin page are
 * sent to the login screen; admin API calls get 401. Every admin response is
 * marked noindex so it never appears in search results.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/admin");
  const isLogin = pathname === `${ADMIN_BASE_PATH}/login` || pathname === "/api/admin/login";

  if (!isLogin && !(await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value))) {
    if (isApi) return NextResponse.json({ error: "Not signed in" }, { status: 401, headers: { "X-Robots-Tag": "noindex, nofollow" } });
    const url = req.nextUrl.clone();
    url.pathname = `${ADMIN_BASE_PATH}/login`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: ["/hc-admin/:path*", "/hc-admin", "/api/admin/:path*"],
};
