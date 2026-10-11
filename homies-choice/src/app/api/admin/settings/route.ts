import { adminRoute, json, refreshStorefront } from "@/lib/server/admin-api";
import { getSettings, parseSettings } from "@/lib/server/settings";
import { rest } from "@/lib/server/supabase";

export const GET = adminRoute(async () => json({ settings: await getSettings({ fresh: true }) }));

export const PUT = adminRoute(
  async (req) => {
    const settings = parseSettings(await req.json().catch(() => ({})));
    await rest("settings?on_conflict=key", {
      method: "POST",
      body: JSON.stringify({ key: "store", value: settings, updated_at: new Date().toISOString() }),
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    });
    refreshStorefront("settings");
    return json({ settings });
  },
  { write: true, needsDb: true },
);
