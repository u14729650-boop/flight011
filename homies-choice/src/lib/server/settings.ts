import { siteConfig } from "@/config/site";
import { rest, SETTINGS_TAG, supabaseConfigured } from "./supabase";

export interface StoreSettings {
  announcement: { enabled: boolean; text: string; href: string | null };
}

export const defaultSettings: StoreSettings = {
  announcement: {
    enabled: siteConfig.announcement.enabled,
    text: siteConfig.announcement.text,
    href: siteConfig.announcement.href,
  },
};

export function parseSettings(raw: unknown): StoreSettings {
  const a = ((raw as Record<string, unknown>)?.announcement ?? {}) as Record<string, unknown>;
  const text = typeof a.text === "string" ? a.text.trim().slice(0, 140) : "";
  const href = typeof a.href === "string" && /^\/[\w\-/?=&.%]*$/.test(a.href.trim()) ? a.href.trim() : null;
  return {
    announcement: {
      enabled: Boolean(a.enabled) && text.length > 0,
      text: text || defaultSettings.announcement.text,
      href,
    },
  };
}

export async function getSettings(opts: { fresh?: boolean } = {}): Promise<StoreSettings> {
  if (!supabaseConfigured()) return defaultSettings;
  try {
    const rows = await rest<{ value: unknown }[]>(
      "settings?key=eq.store&select=value",
      opts.fresh ? { cache: "no-store" } : { next: { tags: [SETTINGS_TAG], revalidate: 600 } },
    );
    return rows[0] ? parseSettings(rows[0].value) : defaultSettings;
  } catch {
    return defaultSettings;
  }
}
