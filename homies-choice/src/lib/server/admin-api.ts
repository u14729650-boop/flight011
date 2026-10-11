import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminRequest } from "./admin-auth";
import { BANNERS_TAG, CATALOGUE_TAG, DbError, SETTINGS_TAG, supabaseConfigured } from "./supabase";

const noStore = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: noStore });
}

/**
 * Wraps an admin route handler: requires a valid session, and for writes the
 * custom `x-hc-admin` header (blocks cross-site form posts), plus a database.
 */
export function adminRoute<A extends unknown[]>(
  handler: (req: Request, ...args: A) => Promise<Response>,
  opts: { write?: boolean; needsDb?: boolean } = {},
) {
  return async (req: Request, ...args: A): Promise<Response> => {
    if (!(await isAdminRequest(req))) return json({ error: "Not signed in" }, 401);
    if (opts.write && req.headers.get("x-hc-admin") !== "1") return json({ error: "Bad request" }, 400);
    if (opts.needsDb && !supabaseConfigured())
      return json({ error: "Connect Supabase (see README) to save changes. The shop is currently using the built-in catalogue." }, 503);
    try {
      return await handler(req, ...args);
    } catch (err) {
      console.error("Admin API error", err);
      const msg =
        err instanceof DbError
          ? `Database error: ${err.message}. Check the Supabase setup in the README (run supabase/schema.sql).`
          : "Something went wrong.";
      return json({ error: msg }, 500);
    }
  };
}

const TAGS = { catalogue: CATALOGUE_TAG, settings: SETTINGS_TAG, banners: BANNERS_TAG } as const;

export function refreshStorefront(kind: keyof typeof TAGS) {
  revalidateTag(TAGS[kind], { expire: 0 });
  revalidatePath("/", "layout");
}
