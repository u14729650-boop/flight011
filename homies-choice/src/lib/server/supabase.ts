/**
 * Minimal Supabase REST client for server code only.
 * Uses the service-role key, which must never reach the browser.
 */

export const CATALOGUE_TAG = "catalogue";
export const SETTINGS_TAG = "settings";
export const IMAGE_BUCKET = "product-images";

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function base(): string {
  return process.env.SUPABASE_URL!.replace(/\/$/, "");
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return { apikey: key, Authorization: `Bearer ${key}`, ...extra };
}

export class SupabaseError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Call PostgREST: `rest("products?select=*")`. */
export async function rest<T = unknown>(
  path: string,
  init: RequestInit & { next?: { tags?: string[]; revalidate?: number | false } } = {},
): Promise<T> {
  const res = await fetch(`${base()}/rest/v1/${path}`, {
    ...init,
    headers: headers({ "Content-Type": "application/json", ...(init.headers as Record<string, string>) }),
  });
  if (!res.ok) throw new SupabaseError(res.status, await res.text().catch(() => res.statusText));
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function uploadObject(objectPath: string, body: ArrayBuffer, contentType: string): Promise<string> {
  const res = await fetch(`${base()}/storage/v1/object/${IMAGE_BUCKET}/${objectPath}`, {
    method: "POST",
    headers: headers({ "Content-Type": contentType, "x-upsert": "true", "Cache-Control": "31536000" }),
    body,
  });
  if (!res.ok) throw new SupabaseError(res.status, await res.text().catch(() => res.statusText));
  return `${base()}/storage/v1/object/public/${IMAGE_BUCKET}/${objectPath}`;
}
