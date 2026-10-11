import { adminRoute, json, refreshStorefront } from "@/lib/server/admin-api";
import { db, unwrap } from "@/lib/server/supabase";

/** Saves a new display order: body { ids: string[] } (first = shown first). */
export const PUT = adminRoute(
  async (req) => {
    const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
    const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 50) : [];
    if (!ids.length) return json({ error: "Nothing to reorder." }, 400);
    const client = db();
    await Promise.all(ids.map(async (id, i) => unwrap(await client.from("banners").update({ sort_order: i }).eq("id", id))));
    refreshStorefront("banners");
    return json({ ok: true });
  },
  { write: true, needsDb: true },
);
