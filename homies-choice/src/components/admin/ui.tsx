"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cx } from "@/lib/format";

export function AdminPageHeader({ eyebrow, title, actions }: { eyebrow?: string; title: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow text-[0.6rem] text-gold-deep">{eyebrow}</p>}
        <h1 className="display mt-2 text-4xl md:text-5xl">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertCircle : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed",
        tone === "success" && "border-[#2f7d5b]/30 bg-[#2f7d5b]/[0.06] text-[#1d5a40]",
        tone === "error" && "border-[#9b2c2c]/30 bg-[#9b2c2c]/[0.05] text-[#7f1d1d]",
        tone === "info" && "border-gold/40 bg-gold/[0.08] text-charcoal",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function Panel({ title, description, children, className }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-[1.5rem] border border-white/80 bg-white/70 p-5 shadow-[0_20px_50px_-35px_rgba(6,59,46,0.35)] backdrop-blur-xl md:p-7", className)}>
      {title && <h2 className="font-serif text-2xl leading-tight">{title}</h2>}
      {description && <p className="mt-1 text-sm text-stone">{description}</p>}
      <div className={cx(title && "mt-6")}>{children}</div>
    </section>
  );
}

export function FieldLabel({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="eyebrow text-[0.6rem] text-stone">{children}</span>
      {hint && <span className="ml-2 text-[0.7rem] text-stone/80">{hint}</span>}
    </label>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="mt-1.5 text-xs text-[#9b2c2c]">
      {message}
    </p>
  ) : null;
}

export const inputClass =
  "mt-1.5 block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-charcoal transition-colors placeholder:text-stone/60 focus:border-emerald focus:outline-none aria-[invalid=true]:border-[#9b2c2c]";

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad" | "gold"; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-[0.08em] uppercase",
        tone === "neutral" && "bg-charcoal/[0.06] text-stone",
        tone === "good" && "bg-[#2f7d5b]/10 text-[#1d5a40]",
        tone === "warn" && "bg-[#c08a2e]/15 text-[#7a5410]",
        tone === "bad" && "bg-[#9b2c2c]/10 text-[#7f1d1d]",
        tone === "gold" && "bg-gold/20 text-gold-deep",
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-16 text-sm text-stone" role="status" aria-live="polite">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" aria-hidden="true" />
      {label}…
    </div>
  );
}

/** An on/off switch (a real checkbox underneath, so it works with labels and keyboards). */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cx("flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-50")}>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-charcoal/15 transition-colors peer-checked:bg-emerald peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
      />
      <span className="min-w-0 text-sm">
        <span className="block font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-relaxed text-stone">{hint}</span>}
      </span>
    </label>
  );
}

/** Sticky save bar shared by the settings pages. */
export function SaveBar({ saving, disabled, label = "Save changes" }: { saving: boolean; disabled?: boolean; label?: string }) {
  return (
    <div className="glass-light sticky bottom-4 z-30 flex justify-end gap-2 rounded-full !border-line/70 !bg-ivory/80 p-2 shadow-[0_24px_50px_-24px_rgba(6,59,46,0.55)] *:flex-1 sm:px-3 sm:py-3 sm:*:flex-none">
      <button type="submit" disabled={saving || disabled} className="btn btn-dark min-h-11 px-6 py-2.5">
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}
