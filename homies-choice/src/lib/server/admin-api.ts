import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminRequest } from "./admin-auth";
import { CATALOGUE_TAG, SETTINGS_TAG, SupabaseError, supabaseConfigured } from "./supabase";

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
      const msg = err instanceof SupabaseError ? `Database error (${err.status}). Check the Supabase setup in the README.` : "Something went wrong.";
      return json({ error: msg }, 500);
    }
  };
}

export function refreshStorefront(kind: "catalogue" | "settings") {
  revalidateTag(kind === "catalogue" ? CATALOGUE_TAG : SETTINGS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}
