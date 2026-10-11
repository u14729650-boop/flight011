"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminApiError, type AdminSettings } from "@/lib/admin-client";

type Message = { tone: "success" | "error"; text: string } | null;

/**
 * Loads the store settings into an editable draft. `save(["checkout"], …)` sends
 * only those sections, so two pages never overwrite each other's work.
 */
export function useSettingsDraft() {
  const [draft, setDraft] = useState<AdminSettings | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi
      .getSettings()
      .then((r) => setDraft(r.settings))
      .catch((e) => setMessage({ tone: "error", text: e instanceof AdminApiError ? e.message : "Couldn't load the settings." }));
  }, []);

  /** Immutable update of one section. */
  function patch<K extends keyof AdminSettings>(key: K, value: Partial<AdminSettings[K]>) {
    setDraft((d) => (d ? { ...d, [key]: { ...d[key], ...value } } : d));
  }

  async function save(keys: (keyof AdminSettings)[], success: string) {
    if (!draft) return;
    setSaving(true);
    setMessage(null);
    try {
      const body = Object.fromEntries(keys.map((k) => [k, draft[k]])) as Partial<AdminSettings>;
      const r = await adminApi.saveSettings(body);
      setDraft(r.settings);
      setMessage({ tone: "success", text: success });
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof AdminApiError ? e.message : "Couldn't save." });
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return { draft, setDraft, patch, save, saving, message };
}
