import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminConfigured, checkCredentials, createSessionToken } from "@/lib/server/admin-auth";

// Simple per-instance throttle against password guessing.
const attempts = new Map<string, { count: number; until: number }>();

export async function POST(req: Request) {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Admin is not set up. Set ADMIN_USERNAME and ADMIN_PASSWORD (8+ characters) on the server." }, { status: 503, headers });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && rec.count >= 5 && rec.until > now) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429, headers });
  }

  const body = (await req.json().catch(() => ({}))) as { username?: unknown; password?: unknown };
  if (!(await checkCredentials(body.username, body.password))) {
    const next = rec && rec.until > now ? { count: rec.count + 1, until: rec.until } : { count: 1, until: now + 15 * 60_000 };
    attempts.set(ip, next);
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "That username or password isn't right." }, { status: 401, headers });
  }
  attempts.delete(ip);

  const { token, maxAge } = await createSessionToken();
  const res = NextResponse.json({ ok: true }, { headers });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  });
  return res;
}
