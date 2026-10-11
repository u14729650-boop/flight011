/**
 * Admin sessions: a signed, expiring cookie (HMAC-SHA256 via Web Crypto),
 * so it works in both the proxy and route handlers.
 *
 * Required env (server-side only):
 *   ADMIN_USERNAME        — the admin login username (e.g. homies@choice)
 *   ADMIN_PASSWORD        — the admin login password
 *   ADMIN_SESSION_SECRET  — long random string used to sign sessions (optional; derived from the password if unset)
 */

export const ADMIN_COOKIE = "hc_admin_session";
export const ADMIN_BASE_PATH = "/hc-admin";
const SESSION_HOURS = 12;

const enc = new TextEncoder();

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8);
}

async function key(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SESSION_SECRET || `hc-session:${process.env.ADMIN_PASSWORD ?? ""}`;
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function createSessionToken(): Promise<{ token: string; maxAge: number }> {
  const maxAge = SESSION_HOURS * 3600;
  const payload = b64url(enc.encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + maxAge })));
  const sig = b64url(await crypto.subtle.sign("HMAC", await key(), enc.encode(payload)));
  return { token: `${payload}.${sig}`, maxAge };
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !adminConfigured()) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(), fromB64url(sig), enc.encode(payload));
    if (!ok) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return typeof exp === "number" && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

/** Constant-time string comparison (compares SHA-256 digests). */
async function safeEqual(candidate: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(candidate)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function checkPassword(candidate: unknown): Promise<boolean> {
  if (!adminConfigured() || typeof candidate !== "string") return false;
  return safeEqual(candidate, process.env.ADMIN_PASSWORD!);
}

/** Username (when ADMIN_USERNAME is set, case-insensitive) and password must both match. */
export async function checkCredentials(username: unknown, password: unknown): Promise<boolean> {
  const expectedUser = (process.env.ADMIN_USERNAME ?? "").trim().toLowerCase();
  const user = typeof username === "string" ? username.trim().toLowerCase() : "";
  // Always run both comparisons so timing doesn't reveal which one failed.
  const [userOk, passOk] = await Promise.all([expectedUser ? safeEqual(user, expectedUser) : Promise.resolve(true), checkPassword(password)]);
  return userOk && passOk;
}

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

/** For route handlers: is this request from a signed-in admin? */
export async function isAdminRequest(req: Request): Promise<boolean> {
  return verifySessionToken(readCookie(req.headers.get("cookie"), ADMIN_COOKIE));
}
