import { defaultSettings, parseSettings, type StoreSettings } from "@/lib/store-settings";
import { db, SETTINGS_TAG, supabaseConfigured, unwrap } from "./supabase";

export { defaultSettings, parseSettings, type StoreSettings };

/** The owner's settings (Dashboard → Home page / Payments / Store settings), cached until they change. */
export async function getSettings(opts: { fresh?: boolean } = {}): Promise<StoreSettings> {
  if (!supabaseConfigured()) return defaultSettings;
  try {
    const client = db(opts.fresh ? "no-store" : { tags: [SETTINGS_TAG] });
    const row = unwrap(await client.from("settings").select("value").eq("key", "store").maybeSingle());
    return row ? parseSettings(row.value) : defaultSettings;
  } catch {
    return defaultSettings;
  }
}
