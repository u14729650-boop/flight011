import { adminRoute, json, refreshStorefront } from "@/lib/server/admin-api";
import { getSettings, parseSettings } from "@/lib/server/settings";
import { settingsProblems } from "@/lib/store-settings";
import { db, unwrap } from "@/lib/server/supabase";

export const GET = adminRoute(async () => json({ settings: await getSettings({ fresh: true }) }));

/** Saves the sections sent (e.g. just `checkout`); everything else keeps its current value. */
export const PUT = adminRoute(
  async (req) => {
    const body = await req.json().catch(() => ({}));
    const problems = settingsProblems(body);
    if (problems.length) return json({ error: problems.join(" ") }, 422);
    const settings = parseSettings(body, await getSettings({ fresh: true }));
    unwrap(await db().from("settings").upsert({ key: "store", value: JSON.parse(JSON.stringify(settings)) }, { onConflict: "key" }));
    refreshStorefront("settings");
    return json({ settings });
  },
  { write: true, needsDb: true },
);
