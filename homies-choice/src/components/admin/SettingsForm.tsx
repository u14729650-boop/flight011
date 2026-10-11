"use client";

import { ExternalLink } from "lucide-react";
import { siteConfig } from "@/config/site";
import { defaultPolicyBody } from "@/data/policies";
import { cx } from "@/lib/format";
import { addressLines, POLICY_MAX, policyPages, type StoreSettings } from "@/lib/store-settings";
import { useAdminData } from "./AdminShell";
import { useSettingsDraft } from "./useSettingsDraft";
import { AdminPageHeader, FieldLabel, inputClass, Notice, Panel, SaveBar, Spinner, Toggle } from "./ui";

type Business = StoreSettings["business"];

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  max,
  placeholder,
  type = "text",
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} hint={hint}>{label}</FieldLabel>
      <input id={id} type={type} maxLength={max} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function SettingsForm() {
  const { status } = useAdminData();
  const { draft, patch, save, saving, message } = useSettingsDraft();
  if (!draft || !status) return message ? <Notice tone="error">{message.text}</Notice> : <Spinner />;
  const a = draft.announcement;
  const b = draft.business;
  const setB = (v: Partial<Business>) => patch("business", v);
  const [street, city] = addressLines(b);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(["business", "announcement", "seo", "policies"], "Saved. Your details are updated across the website.");
      }}
      className="space-y-8"
    >
      <AdminPageHeader eyebrow="Store" title="Store settings" />
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Panel title="Business details" description="Used on every page: the header and footer, contact page, WhatsApp buttons, policies and Google's store listing.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="b-wa" label="WhatsApp number" hint="with country code" value={b.whatsapp} onChange={(whatsapp) => setB({ whatsapp })} max={24} placeholder="+91 96620 41440" />
          <Field id="b-phone" label="Calling number" hint="optional, if different" value={b.phone ?? ""} onChange={(v) => setB({ phone: v || null })} max={24} />
          <Field id="b-owner" label="Contact person" value={b.owner} onChange={(owner) => setB({ owner })} max={60} />
          <Field id="b-hours" label="Opening hours" hint="optional" value={b.hours ?? ""} onChange={(v) => setB({ hours: v || null })} max={80} placeholder="e.g. Open daily, 11 am – 10 pm" />
          <Field id="b-a1" label="Address line 1" value={b.addressLine1} onChange={(addressLine1) => setB({ addressLine1 })} max={80} />
          <Field id="b-a2" label="Address line 2" hint="optional" value={b.addressLine2} onChange={(addressLine2) => setB({ addressLine2 })} max={80} />
          <Field id="b-area" label="Area / neighbourhood" hint="“Visit us in …”" value={b.area} onChange={(area) => setB({ area })} max={40} />
          <Field id="b-city" label="City" value={b.locality} onChange={(locality) => setB({ locality })} max={60} />
          <Field id="b-region" label="State" value={b.region} onChange={(region) => setB({ region })} max={60} />
          <Field id="b-pin" label="PIN code" hint="optional" value={b.postalCode ?? ""} onChange={(v) => setB({ postalCode: v || null })} max={12} />
          <Field id="b-maps" label="Google Maps link" value={b.mapsUrl} onChange={(mapsUrl) => setB({ mapsUrl })} max={500} type="url" className="sm:col-span-2" />
          <Field id="b-email" label="Email" hint="optional" value={b.email ?? ""} onChange={(v) => setB({ email: v || null })} max={120} type="email" />
          <Field id="b-insta" label="Instagram link" hint="optional" value={b.instagram ?? ""} onChange={(v) => setB({ instagram: v || null })} max={200} type="url" placeholder="https://www.instagram.com/…" />
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="b-blurb" hint={`${b.footerBlurb.length}/240`}>About the shop (footer)</FieldLabel>
            <textarea id="b-blurb" rows={2} maxLength={240} className={cx(inputClass, "resize-none")} value={b.footerBlurb} onChange={(e) => setB({ footerBlurb: e.target.value })} />
          </div>
        </div>
        <p className="mt-5 rounded-2xl bg-ivory/80 px-4 py-3 text-sm text-stone">
          <span className="text-charcoal">{siteConfig.name}</span> · {street}, {city} · {b.whatsapp}
        </p>
      </Panel>

      <Panel title="Announcement bar" description="The slim line of text above the navigation on every page.">
        <div className="space-y-5">
          <Toggle checked={a.enabled} onChange={(enabled) => patch("announcement", { enabled })} label="Show the announcement bar" />
          <div>
            <FieldLabel htmlFor="s-text" hint={`${a.text.length}/140`}>Text</FieldLabel>
            <input id="s-text" maxLength={140} className={inputClass} value={a.text} onChange={(e) => patch("announcement", { text: e.target.value })} />
          </div>
          <div>
            <FieldLabel htmlFor="s-href" hint="optional, a page on this site">Link</FieldLabel>
            <input id="s-href" className={inputClass} value={a.href ?? ""} onChange={(e) => patch("announcement", { href: e.target.value || null })} placeholder="/shop" />
          </div>
          <div className="on-dark rounded-full bg-forest px-4 py-2.5 text-center text-[0.6rem] font-semibold tracking-[0.2em] text-ivory/85 uppercase" aria-label="Preview">
            {a.enabled ? a.text : "Announcement bar hidden"}
          </div>
        </div>
      </Panel>

      <Panel title="Search engines" description="How the home page appears in Google results and when the link is shared.">
        <div className="space-y-5">
          <div>
            <FieldLabel htmlFor="seo-title" hint={`${draft.seo.title.length}/90`}>Page title</FieldLabel>
            <input id="seo-title" maxLength={90} className={inputClass} value={draft.seo.title} onChange={(e) => patch("seo", { title: e.target.value })} />
          </div>
          <div>
            <FieldLabel htmlFor="seo-desc" hint={`${draft.seo.description.length}/300`}>Description</FieldLabel>
            <textarea id="seo-desc" rows={3} maxLength={300} className={cx(inputClass, "resize-none")} value={draft.seo.description} onChange={(e) => patch("seo", { description: e.target.value })} />
          </div>
          <div className="rounded-2xl border border-line bg-white p-4" aria-label="Search result preview">
            <p className="truncate text-xs text-[#4d5156]">{siteConfig.url.replace(/^https?:\/\//, "")}</p>
            <p className="mt-1 truncate text-lg text-[#1a0dab]">{draft.seo.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{draft.seo.description}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Policies" description="Leave a policy empty to use the standard wording (shown faintly). Separate paragraphs with a blank line.">
        <div className="space-y-6">
          {policyPages.map((p) => (
            <div key={p.slug}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <FieldLabel htmlFor={`pol-${p.slug}`} hint={draft.policies[p.slug] ? `${draft.policies[p.slug].length}/${POLICY_MAX}` : "standard wording"}>
                  {p.title}
                </FieldLabel>
                <span className="flex gap-3 text-xs">
                  {draft.policies[p.slug] ? (
                    <button type="button" className="font-semibold text-stone hover:text-charcoal" onClick={() => patch("policies", { [p.slug]: "" })}>
                      Use standard wording
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="font-semibold text-stone hover:text-charcoal"
                      onClick={() => patch("policies", { [p.slug]: defaultPolicyBody(p.slug, b).join("\n\n") })}
                    >
                      Edit the standard wording
                    </button>
                  )}
                  <a href={`/policies/${p.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold hover:text-emerald">
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </div>
              <textarea
                id={`pol-${p.slug}`}
                rows={draft.policies[p.slug] ? 8 : 3}
                maxLength={POLICY_MAX}
                className={inputClass}
                value={draft.policies[p.slug]}
                onChange={(e) => patch("policies", { [p.slug]: e.target.value })}
                placeholder={defaultPolicyBody(p.slug, b).join("\n\n")}
              />
            </div>
          ))}
        </div>
      </Panel>

      <SaveBar saving={saving} disabled={!status.database} label="Save settings" />
    </form>
  );
}
