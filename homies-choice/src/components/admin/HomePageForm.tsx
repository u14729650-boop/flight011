"use client";

import { ExternalLink } from "lucide-react";
import { homeSections, type CallToAction } from "@/lib/store-settings";
import { cx } from "@/lib/format";
import { LIQUIDS, liquidNames } from "@/components/home/bottle/liquids";
import { Bottle3D } from "@/components/home/bottle/Bottle3D";
import { useAdminData } from "./AdminShell";
import { useSettingsDraft } from "./useSettingsDraft";
import { AdminPageHeader, FieldLabel, inputClass, Notice, Panel, SaveBar, Spinner, Toggle } from "./ui";

function CtaFields({ id, value, onChange, optional }: { id: string; value: CallToAction; onChange: (v: CallToAction) => void; optional?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <FieldLabel htmlFor={`${id}-label`} hint={optional ? "leave empty to hide" : undefined}>Button text</FieldLabel>
        <input id={`${id}-label`} maxLength={40} className={inputClass} value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} />
      </div>
      <div>
        <FieldLabel htmlFor={`${id}-href`} hint="a page, e.g. /shop">Button link</FieldLabel>
        <input id={`${id}-href`} maxLength={300} className={inputClass} value={value.href} onChange={(e) => onChange({ ...value, href: e.target.value })} placeholder="/shop" />
      </div>
    </div>
  );
}

export function HomePageForm() {
  const { status } = useAdminData();
  const { draft, patch, save, saving, message } = useSettingsDraft();
  if (!draft || !status) return message ? <Notice tone="error">{message.text}</Notice> : <Spinner />;
  const hero = draft.home.hero;
  const setHero = (v: Partial<typeof hero>) => patch("home", { hero: { ...hero, ...v } });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(["home"], "Saved. The home page is updated.");
      }}
      className="space-y-8"
    >
      <AdminPageHeader
        eyebrow="Website"
        title="Home page"
        actions={
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark min-h-10 px-4 py-2">
            <ExternalLink className="h-4 w-4" /> View home page
          </a>
        }
      />
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Panel title="Hero visual" description="What sits beside the headline at the top of the home page.">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Hero visual">
              {(
                [
                  { v: "bottle", title: "3D perfume bottle", body: "A turning, interactive Homies Choice flacon." },
                  { v: "image", title: "Photograph & monogram", body: "The emerald satin with the HC monogram in a gold arch." },
                ] as const
              ).map((o) => (
                <label
                  key={o.v}
                  className={cx(
                    "flex cursor-pointer gap-3 rounded-2xl border p-4",
                    hero.visual === o.v ? "border-emerald bg-emerald/[0.05] ring-1 ring-emerald" : "border-line bg-white/60",
                  )}
                >
                  <input type="radio" name="hero-visual" className="mt-1 h-4 w-4 accent-emerald" checked={hero.visual === o.v} onChange={() => setHero({ visual: o.v })} />
                  <span className="text-sm">
                    <span className="block font-medium">{o.title}</span>
                    <span className="mt-0.5 block text-xs text-stone">{o.body}</span>
                  </span>
                </label>
              ))}
            </div>

            <fieldset disabled={hero.visual !== "bottle"} className="disabled:opacity-50">
              <legend className="eyebrow text-[0.6rem] text-stone">Perfume colour</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {liquidNames.map((l) => (
                  <label
                    key={l}
                    className={cx(
                      "flex cursor-pointer items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 text-sm transition-colors",
                      hero.liquid === l ? "border-emerald bg-emerald/[0.06]" : "border-line bg-white/70 hover:border-charcoal/40",
                    )}
                  >
                    <input type="radio" name="liquid" className="sr-only" checked={hero.liquid === l} onChange={() => setHero({ liquid: l })} />
                    <span className="h-6 w-6 rounded-full border border-black/10" style={{ background: LIQUIDS[l].swatch }} aria-hidden="true" />
                    {LIQUIDS[l].label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {hero.visual === "bottle" && (
            <div className="on-dark relative overflow-hidden rounded-[1.5rem] bg-forest">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(16,98,74,0.9),transparent_65%)]" aria-hidden="true" />
              <Bottle3D liquid={hero.liquid} className="aspect-[4/5] w-full" />
              <p className="absolute inset-x-0 bottom-3 text-center text-[0.65rem] tracking-[0.14em] text-ivory/60 uppercase">Live preview · drag to turn</p>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Headline" description="The words customers see first.">
        <div className="space-y-5">
          <div>
            <FieldLabel htmlFor="h-eyebrow">Small line above the headline</FieldLabel>
            <input id="h-eyebrow" maxLength={60} className={inputClass} value={hero.eyebrow} onChange={(e) => setHero({ eyebrow: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="h-start">Headline start</FieldLabel>
              <input id="h-start" maxLength={40} className={inputClass} value={hero.titleStart} onChange={(e) => setHero({ titleStart: e.target.value })} />
            </div>
            <div>
              <FieldLabel htmlFor="h-accent" hint="gold italic">Highlighted word</FieldLabel>
              <input id="h-accent" maxLength={30} className={inputClass} value={hero.titleAccent} onChange={(e) => setHero({ titleAccent: e.target.value })} />
            </div>
            <div>
              <FieldLabel htmlFor="h-end">Headline end</FieldLabel>
              <input id="h-end" maxLength={40} className={inputClass} value={hero.titleEnd} onChange={(e) => setHero({ titleEnd: e.target.value })} />
            </div>
          </div>
          <div className="on-dark rounded-2xl bg-forest px-5 py-6 text-ivory" aria-label="Headline preview">
            <p className="display text-4xl sm:text-5xl">
              {hero.titleStart} <em className="font-normal text-gold italic">{hero.titleAccent}</em> {hero.titleEnd}
            </p>
            <p className="mt-3 max-w-md text-sm font-light text-ivory/70">{hero.subtitle}</p>
          </div>
          <div>
            <FieldLabel htmlFor="h-sub" hint={`${hero.subtitle.length}/220`}>Supporting text</FieldLabel>
            <textarea id="h-sub" rows={2} maxLength={220} className={cx(inputClass, "resize-none")} value={hero.subtitle} onChange={(e) => setHero({ subtitle: e.target.value })} />
          </div>
          <div className="space-y-3">
            <p className="eyebrow text-[0.6rem] text-gold-deep">Main button</p>
            <CtaFields id="h-primary" value={hero.primary} onChange={(primary) => setHero({ primary })} />
          </div>
          <div className="space-y-3">
            <p className="eyebrow text-[0.6rem] text-gold-deep">Second button</p>
            <CtaFields id="h-secondary" optional value={hero.secondary} onChange={(secondary) => setHero({ secondary })} />
          </div>
          <Toggle checked={hero.showStats} onChange={(showStats) => setHero({ showStats })} label="Show the figures panel" hint="Number of fragrances, perfume houses and your area." />
        </div>
      </Panel>

      <Panel title="Sections" description="Switch parts of the home page on or off. The hero always shows.">
        <ul className="grid gap-4 sm:grid-cols-2">
          {homeSections.map((s) => (
            <li key={s.key}>
              <Toggle
                checked={draft.home.sections[s.key]}
                onChange={(v) => patch("home", { sections: { ...draft.home.sections, [s.key]: v } })}
                label={s.label}
                hint={s.hint}
              />
            </li>
          ))}
        </ul>
      </Panel>

      <SaveBar saving={saving} disabled={!status.database} label="Save home page" />
    </form>
  );
}
