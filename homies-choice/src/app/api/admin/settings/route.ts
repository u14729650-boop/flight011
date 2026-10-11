import { adminRoute, json, refreshStorefront } from "@/lib/server/admin-api";
import { getSettings, parseSettings } from "@/lib/server/settings";
import { db, unwrap } from "@/lib/server/supabase";

export const GET = adminRoute(async () => json({ settings: await getSettings({ fresh: true }) }));

export const PUT = adminRoute(
  async (req) => {
    const settings = parseSettings(await req.json().catch(() => ({})));
    unwrap(await db().from("settings").upsert({ key: "store", value: JSON.parse(JSON.stringify(settings)) }, { onConflict: "key" }));
    refreshStorefront("settings");
    return json({ settings });
  },
  { write: true, needsDb: true },
);
