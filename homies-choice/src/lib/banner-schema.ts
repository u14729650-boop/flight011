import type { Banner, BannerImage, BannerPlacement, BannerTheme } from "@/data/banners";

/** Banner validation shared by the admin editor (browser) and the admin API (server). */

export type BannerErrors = Record<string, string>;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function image(v: unknown, fallbackAlt: string, allowData: boolean): BannerImage | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const src = str(o.src, allowData ? 3_000_000 : 600);
  const ok = /^(https:\/\/|\/(?!\/))/.test(src) || (allowData && /^data:image\/(png|jpe?g|webp|avif);base64,/.test(src));
  if (!ok) return null;
  return {
    src,
    alt: str(o.alt, 200) || fallbackAlt,
    width: Math.max(1, Math.round(Number(o.width) || 1600)),
    height: Math.max(1, Math.round(Number(o.height) || 900)),
  };
}

function date(v: unknown): string | null | "invalid" {
  if (v == null || v === "") return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? "invalid" : d.toISOString();
}

export function parseBannerInput(raw: unknown, opts: { allowDataImages?: boolean } = {}): { banner: Banner; errors: BannerErrors } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: BannerErrors = {};

  const placement: BannerPlacement = r.placement === "shop" ? "shop" : "home";
  const theme: BannerTheme = r.theme === "light" ? "light" : "dark";
  const title = str(r.title, 90);
  if (!title) errors.title = "Add a headline.";

  const ctaLabel = str(r.ctaLabel, 40) || null;
  const ctaHref = str(r.ctaHref, 300) || null;
  if (ctaHref && !/^(\/(?!\/)[\w\-/?=&.%#]*|https:\/\/\S+)$/.test(ctaHref)) errors.ctaHref = "Use a page on this site (e.g. /watches) or a full https:// link.";
  if (ctaLabel && !ctaHref) errors.ctaHref = "Add where the button should go.";
  if (ctaHref && !ctaLabel) errors.ctaLabel = "Add the button text.";

  const img = image(r.image, title, opts.allowDataImages === true);
  if (!img) errors.image = "Add a banner image.";
  const mobileImage = image(r.mobileImage, title, opts.allowDataImages === true);

  const startsAt = date(r.startsAt);
  const endsAt = date(r.endsAt);
  if (startsAt === "invalid") errors.startsAt = "Enter a valid start date.";
  if (endsAt === "invalid") errors.endsAt = "Enter a valid end date.";
  if (startsAt && endsAt && startsAt !== "invalid" && endsAt !== "invalid" && endsAt <= startsAt) errors.endsAt = "The end must be after the start.";

  const banner: Banner = {
    id: str(r.id, 64),
    placement,
    eyebrow: str(r.eyebrow, 60) || null,
    title,
    subtitle: str(r.subtitle, 220) || null,
    ctaLabel,
    ctaHref,
    image: img,
    mobileImage,
    theme,
    startsAt: startsAt === "invalid" ? null : startsAt,
    endsAt: endsAt === "invalid" ? null : endsAt,
    active: r.active === undefined ? true : Boolean(r.active),
    sortOrder: Number.isFinite(Number(r.sortOrder)) ? Math.round(Number(r.sortOrder)) : 0,
  };
  return { banner, errors };
}
