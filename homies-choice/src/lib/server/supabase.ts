/**
 * Supabase access for server code only (route handlers, server components).
 * Uses the official client with the service-role key, which must never reach
 * the browser. Storefront reads are cached by Next.js with tags, so pages stay
 * static and fast until the admin saves a change (which revalidates the tag).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export const CATALOGUE_TAG = "catalogue";
export const SETTINGS_TAG = "settings";
export const BANNERS_TAG = "banners";
export const IMAGE_BUCKET = "product-images";

/** Cached storefront reads refresh at least daily; admin saves refresh them instantly. */
export const STOREFRONT_REVALIDATE = 60 * 60 * 24;

export type Db = SupabaseClient<Database>;

/**
 * The project URL and the server-only secret key. The second names are the ones
 * Vercel's Supabase integration adds, so connecting it there needs no renaming.
 */
const supabaseUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

export function supabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}

type CacheMode = { tags: string[]; revalidate?: number } | "no-store";

/**
 * A server client whose HTTP requests use Next's data cache.
 * - `{ tags }`  → cached and shared across requests, invalidated by revalidateTag()
 * - "no-store" → always fresh (admin panel, writes)
 */
export function db(cache: CacheMode = "no-store"): Db {
  const cachedFetch: typeof fetch = (input, init) =>
    fetch(input, cache === "no-store" ? { ...init, cache: "no-store" } : { ...init, next: { tags: cache.tags, revalidate: cache.revalidate ?? STOREFRONT_REVALIDATE } });
  return createClient<Database>(supabaseUrl(), supabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: cachedFetch },
  });
}

export class DbError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

/** Throws on a Supabase error and returns the data. */
export function unwrap<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) throw new DbError(res.error.message, res.error.code);
  return res.data;
}

/** Upload to Supabase Storage and return the public URL. */
export async function uploadObject(objectPath: string, body: ArrayBuffer, contentType: string): Promise<string> {
  const client = db();
  const { error } = await client.storage.from(IMAGE_BUCKET).upload(objectPath, body, { contentType, upsert: true, cacheControl: "31536000" });
  if (error) throw new DbError(error.message);
  return client.storage.from(IMAGE_BUCKET).getPublicUrl(objectPath).data.publicUrl;
}
