"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { adminApi, AdminApiError, type AdminSettings } from "@/lib/admin-client";
import { useAdminData } from "./AdminShell";
import { AdminPageHeader, FieldLabel, inputClass, Notice, Panel, Spinner } from "./ui";

export function SettingsForm() {
  const { status } = useAdminData();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then((r) => setSettings(r.settings)).catch(() => setSettings({ announcement: { ...siteConfig.announcement } }));
  }, []);

  if (!settings || !status) return <Spinner />;
  const a = settings.announcement;
  const setA = (patch: Partial<AdminSettings["announcement"]>) => setSettings({ announcement: { ...a, ...patch } });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const r = await adminApi.saveSettings(settings);
      setSettings(r.settings);
      setMessage({ tone: "success", text: "Saved. The announcement bar is updated." });
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof AdminApiError ? err.message : "Couldn't save." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-8">
      <AdminPageHeader eyebrow="Store" title="Settings" />
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      <Panel title="Announcement bar" description="The slim line of text above the navigation on every page.">
        <div className="space-y-5">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-emerald" checked={a.enabled} onChange={(e) => setA({ enabled: e.target.checked })} />
            Show the announcement bar
          </label>
          <div>
            <FieldLabel htmlFor="s-text" hint={`${a.text.length}/140`}>Text</FieldLabel>
            <input id="s-text" maxLength={140} className={inputClass} value={a.text} onChange={(e) => setA({ text: e.target.value })} />
          </div>
          <div>
            <FieldLabel htmlFor="s-href" hint="optional, a page on this site">Link</FieldLabel>
            <input id="s-href" className={inputClass} value={a.href ?? ""} onChange={(e) => setA({ href: e.target.value || null })} placeholder="/shop" />
          </div>
          <div className="on-dark bg-forest px-4 py-2.5 text-center text-[0.6rem] font-semibold tracking-[0.2em] text-ivory/85 uppercase" aria-label="Preview">
            {a.enabled ? a.text : "Announcement bar hidden"}
          </div>
        </div>
      </Panel>
      <Panel title="Business details" description="Shown in the footer, contact page and WhatsApp links. To change these, edit src/config/site.ts.">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-stone">WhatsApp</dt><dd>{siteConfig.whatsapp.display}</dd></div>
          <div><dt className="text-stone">Contact</dt><dd>{siteConfig.owner}</dd></div>
          <div className="sm:col-span-2"><dt className="text-stone">Address</dt><dd>{siteConfig.address.lines.join(", ")}, {siteConfig.address.locality}</dd></div>
        </dl>
      </Panel>
      <div className="flex justify-end">
        <button type="submit" disabled={saving || !status.database} className="btn btn-dark">{saving ? "Saving…" : "Save settings"}</button>
      </div>
    </form>
  );
}
