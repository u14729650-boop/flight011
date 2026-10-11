/**
 * Everything the shop owner can change from the dashboard: business details,
 * the home page, payments at checkout, search-engine text and the announcement
 * bar. Shared by the storefront, the admin and the API, so it holds no secrets.
 *
 * `parseSettings` is the single gatekeeper: it trims, length-limits and checks
 * every field, falling back to the current value (or the default) for anything
 * missing, so a stored row from an older version still loads.
 */
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";
import { isLiquid, type Liquid } from "@/components/home/bottle/liquids";

export const homeSections = [
  { key: "services", label: "Service strip", hint: "WhatsApp, visit us and personal guidance, under the hero" },
  { key: "banners", label: "Featured banners", hint: "The home carousel (Dashboard → Banners)" },
  { key: "collections", label: "Shop by collection", hint: "Designer, Arabic, men's and women's tiles" },
  { key: "bestsellers", label: "Bestsellers", hint: "Products marked as bestsellers" },
  { key: "story", label: "Our story", hint: "“Not just a perfume. Your personal signature.”" },
  { key: "moods", label: "Shop by mood", hint: "Fresh, warm, woody and more" },
  { key: "brands", label: "Brand names", hint: "The scrolling list of perfume houses" },
  { key: "watches", label: "Watches", hint: "The watches teaser" },
  { key: "why", label: "Why choose us", hint: "Three reasons to shop with you" },
  { key: "contact", label: "Contact & enquiry form", hint: "Address, WhatsApp and the enquiry form" },
] as const;
export type HomeSection = (typeof homeSections)[number]["key"];

export const policyPages = [
  { slug: "privacy", title: "Privacy Policy" },
  { slug: "terms", title: "Terms & Conditions" },
  { slug: "shipping", title: "Shipping Policy" },
  { slug: "returns", title: "Returns & Refunds" },
] as const;
export type PolicySlug = (typeof policyPages)[number]["slug"];
export const POLICY_MAX = 6000;

export interface CallToAction {
  label: string;
  href: string;
}

export interface StoreSettings {
  announcement: { enabled: boolean; text: string; href: string | null };
  business: {
    /** As shown to customers, e.g. "+91 96620 41440". WhatsApp links use its digits. */
    whatsapp: string;
    /** Separate calling number, if different from WhatsApp. */
    phone: string | null;
    owner: string;
    addressLine1: string;
    addressLine2: string;
    /** Neighbourhood, e.g. "Paldi" ("Visit us in Paldi"). */
    area: string;
    locality: string;
    region: string;
    postalCode: string | null;
    mapsUrl: string;
    hours: string | null;
    email: string | null;
    instagram: string | null;
    footerBlurb: string;
  };
  home: {
    hero: {
      visual: "bottle" | "image";
      liquid: Liquid;
      eyebrow: string;
      titleStart: string;
      titleAccent: string;
      titleEnd: string;
      subtitle: string;
      primary: CallToAction;
      /** Hidden when its label is empty. */
      secondary: CallToAction;
      showStats: boolean;
    };
    sections: Record<HomeSection, boolean>;
  };
  checkout: {
    /** Cash on delivery, optionally with an advance "token" paid by UPI to confirm the order. */
    cod: { enabled: boolean; tokenEnabled: boolean; tokenAmount: number; note: string };
    upi: { enabled: boolean; vpa: string; payeeName: string; note: string };
  };
  seo: { title: string; description: string };
  /** Custom policy text (paragraphs separated by a blank line); empty uses the standard wording. */
  policies: Record<PolicySlug, string>;
}

export const defaultSettings: StoreSettings = {
  announcement: {
    enabled: siteConfig.announcement.enabled,
    text: siteConfig.announcement.text,
    href: siteConfig.announcement.href,
  },
  business: {
    whatsapp: siteConfig.whatsapp.display,
    phone: null,
    owner: siteConfig.owner,
    addressLine1: siteConfig.address.lines[0],
    addressLine2: siteConfig.address.lines[1],
    area: "Paldi",
    locality: siteConfig.address.locality,
    region: siteConfig.address.region,
    postalCode: null,
    mapsUrl: siteConfig.address.mapsUrl,
    hours: null,
    email: null,
    instagram: siteConfig.instagram,
    footerBlurb:
      "A fragrance store in Ahmedabad for designer perfumes and Arabic fragrances — chosen with care, with personal guidance on WhatsApp.",
  },
  home: {
    hero: {
      visual: "bottle",
      liquid: "emerald",
      eyebrow: siteConfig.tagline,
      titleStart: "Find your",
      titleAccent: "signature",
      titleEnd: "scent.",
      subtitle: "Discover exceptional fragrances from the world’s most loved perfume houses, all in one place.",
      primary: { label: "Shop collection", href: "/shop" },
      secondary: { label: "Explore Arabic perfumes", href: "/collections/arabic" },
      showStats: true,
    },
    sections: Object.fromEntries(homeSections.map((s) => [s.key, true])) as Record<HomeSection, boolean>,
  },
  checkout: {
    cod: { enabled: true, tokenEnabled: false, tokenAmount: 0, note: "" },
    upi: { enabled: false, vpa: "", payeeName: siteConfig.name, note: "" },
  },
  seo: {
    title: "HOMIES CHOICE — Perfume Shop in Ahmedabad | Designer & Arabic Fragrances",
    description: siteConfig.description,
  },
  policies: { privacy: "", terms: "", shipping: "", returns: "" },
};

// ---- Field cleaners ------------------------------------------------------------

type Raw = Record<string, unknown> | undefined;
const obj = (v: unknown): Raw => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined);
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : undefined);

/** Missing → keep `base`; present → cleaned (an empty string falls back to `base` for required text). */
function text(raw: Raw, key: string, base: string, max: number): string {
  const v = clean(raw?.[key], max);
  return v ? v : base;
}
/** Optional text: missing → `base`, empty → null. */
function optText(raw: Raw, key: string, base: string | null, max: number): string | null {
  if (raw?.[key] === undefined) return base;
  return clean(raw[key], max) || null;
}
/** Multi-line text: keeps paragraph breaks, trims the rest. Missing → `base`. */
function longText(raw: Raw, key: string, base: string, max: number): string {
  const v = raw?.[key];
  if (typeof v !== "string") return base;
  return v
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}
function flag(raw: Raw, key: string, base: boolean): boolean {
  const v = raw?.[key];
  return typeof v === "boolean" ? v : base;
}

export const isInternalPath = (v: string) => /^\/(?!\/)[\w\-/?=&.%#~+]*$/.test(v);
export function isHttpsUrl(v: string): boolean {
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
}
/** A page on this site or an https link. */
const isLink = (v: string) => isInternalPath(v) || isHttpsUrl(v);

export const VPA_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;
const PHONE_PATTERN = /^\+?[\d\s()-]{8,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MAX_TOKEN = 50_000;

function cta(raw: unknown, base: CallToAction, allowEmpty: boolean): CallToAction {
  const r = obj(raw);
  if (!r) return base;
  const label = clean(r.label, 40) ?? base.label;
  const href = clean(r.href, 300);
  if (!label && allowEmpty) return { label: "", href: base.href };
  return { label: label || base.label, href: href && isLink(href) ? href : base.href };
}

// ---- Parsing -------------------------------------------------------------------

export function parseSettings(raw: unknown, base: StoreSettings = defaultSettings): StoreSettings {
  const root = obj(raw);
  const a = obj(root?.announcement);
  const b = obj(root?.business);
  const home = obj(root?.home);
  const h = obj(home?.hero);
  const sec = obj(home?.sections);
  const co = obj(root?.checkout);
  const cod = obj(co?.cod);
  const upi = obj(co?.upi);
  const seo = obj(root?.seo);
  const pol = obj(root?.policies);

  const announceText = text(a, "text", base.announcement.text, 140);
  const announceHref = optText(a, "href", base.announcement.href, 300);

  const whatsapp = text(b, "whatsapp", base.business.whatsapp, 24);
  const phone = optText(b, "phone", base.business.phone, 24);
  const mapsUrl = text(b, "mapsUrl", base.business.mapsUrl, 500);
  const email = optText(b, "email", base.business.email, 120);
  const instagram = optText(b, "instagram", base.business.instagram, 200);
  const postal = optText(b, "postalCode", base.business.postalCode, 12);

  const tokenAmount = cod?.tokenAmount === undefined ? base.checkout.cod.tokenAmount : Number(cod.tokenAmount);
  const vpa = upi?.vpa === undefined ? base.checkout.upi.vpa : (clean(upi.vpa, 300) ?? "").replace(/\s/g, "");
  const validVpa = vpa === "" || VPA_PATTERN.test(vpa) ? vpa : base.checkout.upi.vpa;

  const visual = h?.visual === "image" || h?.visual === "bottle" ? h.visual : base.home.hero.visual;
  const liquid = isLiquid(h?.liquid) ? h.liquid : base.home.hero.liquid;

  return {
    announcement: {
      enabled: flag(a, "enabled", base.announcement.enabled),
      text: announceText,
      href: announceHref && isInternalPath(announceHref) ? announceHref : null,
    },
    business: {
      whatsapp: PHONE_PATTERN.test(whatsapp) && digitsOf(whatsapp).length >= 10 ? whatsapp : base.business.whatsapp,
      phone: phone && PHONE_PATTERN.test(phone) ? phone : null,
      owner: text(b, "owner", base.business.owner, 60),
      addressLine1: text(b, "addressLine1", base.business.addressLine1, 80),
      addressLine2: optText(b, "addressLine2", base.business.addressLine2, 80) ?? "",
      area: text(b, "area", base.business.area, 40),
      locality: text(b, "locality", base.business.locality, 60),
      region: text(b, "region", base.business.region, 60),
      postalCode: postal && /^\d{6}$/.test(postal) ? postal : null,
      mapsUrl: isHttpsUrl(mapsUrl) ? mapsUrl : base.business.mapsUrl,
      hours: optText(b, "hours", base.business.hours, 80),
      email: email && EMAIL_PATTERN.test(email) ? email : null,
      instagram: instagram && isHttpsUrl(instagram) ? instagram : null,
      footerBlurb: text(b, "footerBlurb", base.business.footerBlurb, 240),
    },
    home: {
      hero: {
        visual,
        liquid,
        eyebrow: text(h, "eyebrow", base.home.hero.eyebrow, 60),
        titleStart: optText(h, "titleStart", base.home.hero.titleStart, 40) ?? "",
        titleAccent: text(h, "titleAccent", base.home.hero.titleAccent, 30),
        titleEnd: optText(h, "titleEnd", base.home.hero.titleEnd, 40) ?? "",
        subtitle: text(h, "subtitle", base.home.hero.subtitle, 220),
        primary: cta(h?.primary, base.home.hero.primary, false),
        secondary: cta(h?.secondary, base.home.hero.secondary, true),
        showStats: flag(h, "showStats", base.home.hero.showStats),
      },
      sections: Object.fromEntries(homeSections.map(({ key }) => [key, flag(sec, key, base.home.sections[key])])) as Record<HomeSection, boolean>,
    },
    checkout: {
      cod: {
        enabled: flag(cod, "enabled", base.checkout.cod.enabled),
        tokenEnabled: flag(cod, "tokenEnabled", base.checkout.cod.tokenEnabled),
        tokenAmount: Number.isFinite(tokenAmount) ? Math.min(MAX_TOKEN, Math.max(0, Math.round(tokenAmount))) : base.checkout.cod.tokenAmount,
        note: optText(cod, "note", base.checkout.cod.note, 200) ?? "",
      },
      upi: {
        // UPI is only offered once a valid UPI ID is saved.
        enabled: flag(upi, "enabled", base.checkout.upi.enabled) && validVpa !== "",
        vpa: validVpa,
        payeeName: text(upi, "payeeName", base.checkout.upi.payeeName, 50),
        note: optText(upi, "note", base.checkout.upi.note, 200) ?? "",
      },
    },
    seo: {
      title: text(seo, "title", base.seo.title, 90),
      description: text(seo, "description", base.seo.description, 300),
    },
    policies: Object.fromEntries(policyPages.map(({ slug }) => [slug, longText(pol, slug, base.policies[slug], POLICY_MAX)])) as Record<PolicySlug, string>,
  };
}

/** Describes what a save would drop or change, so the dashboard can say why instead of silently ignoring input. */
export function settingsProblems(raw: unknown): string[] {
  const out: string[] = [];
  const root = obj(raw);
  const b = obj(root?.business);
  const upi = obj(obj(root?.checkout)?.upi);
  const cod = obj(obj(root?.checkout)?.cod);
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  if (b) {
    if (b.whatsapp !== undefined && !(PHONE_PATTERN.test(s(b.whatsapp)) && digitsOf(s(b.whatsapp)).length >= 10))
      out.push("WhatsApp number: use the full number with country code, e.g. +91 96620 41440.");
    if (s(b.phone) && !PHONE_PATTERN.test(s(b.phone))) out.push("Phone: that doesn't look like a phone number.");
    if (s(b.mapsUrl) && !isHttpsUrl(s(b.mapsUrl))) out.push("Map link: paste the full https:// link from Google Maps.");
    if (s(b.email) && !EMAIL_PATTERN.test(s(b.email))) out.push("Email: that doesn't look like an email address.");
    if (s(b.instagram) && !isHttpsUrl(s(b.instagram))) out.push("Instagram: paste the full https:// link to your profile.");
    if (s(b.postalCode) && !/^\d{6}$/.test(s(b.postalCode))) out.push("PIN code: use the 6-digit PIN code.");
  }
  if (upi) {
    const vpa = s(upi.vpa).replace(/\s/g, "");
    if (vpa && !VPA_PATTERN.test(vpa)) out.push("UPI ID: use the form name@bank, e.g. yourshop@okaxis.");
    if (upi.enabled === true && !vpa) out.push("UPI: add your UPI ID to switch UPI payments on.");
  }
  if (cod?.tokenAmount !== undefined) {
    const n = Number(cod.tokenAmount);
    if (!Number.isFinite(n) || n < 0 || n > MAX_TOKEN) out.push(`Token amount: enter a number between 0 and ${MAX_TOKEN}.`);
    else if (cod.tokenEnabled === true && Math.round(n) === 0) out.push("Token amount: set an amount above ₹0, or switch the token off.");
  }
  return out;
}

// ---- Helpers used across the site ---------------------------------------------------

export const digitsOf = (v: string) => v.replace(/\D/g, "");

/** Digits for wa.me links; a 10-digit Indian mobile gets the 91 country code. */
export function whatsappDigits(display: string): string {
  const d = digitsOf(display);
  return d.length === 10 ? `91${d}` : d;
}

export function addressLines(b: StoreSettings["business"]): string[] {
  return [
    [b.addressLine1, b.addressLine2].filter(Boolean).join(", "),
    [b.locality, b.region].filter(Boolean).join(", ") + (b.postalCode ? ` ${b.postalCode}` : ""),
  ];
}

/** True when cash on delivery asks for an advance token. */
export const codTokenActive = (c: StoreSettings["checkout"]) => c.cod.enabled && c.cod.tokenEnabled && c.cod.tokenAmount > 0;

/** How cash on delivery works, in one line (checkout and the dashboard preview). */
export const codSummary = (tokenActive: boolean, token: number) =>
  tokenActive
    ? `Pay a ${formatPrice(token)} advance token by UPI now, and the balance in cash when your order arrives.`
    : "Pay in cash when your order arrives.";

/** True when at least one payment option is switched on. */
export const anyPaymentOption = (c: StoreSettings["checkout"]) => c.cod.enabled || c.upi.enabled;

/**
 * A UPI payment link (opens any UPI app on a phone; also encoded in the QR code).
 * Without an amount the customer types it in their app.
 */
export function upiLink(opts: { vpa: string; payeeName: string; amount?: number | null; note?: string }): string {
  const q = new URLSearchParams({ pa: opts.vpa, pn: opts.payeeName.slice(0, 50) });
  if (opts.amount != null && opts.amount > 0) q.set("am", opts.amount.toFixed(2));
  q.set("cu", "INR");
  if (opts.note) q.set("tn", opts.note.slice(0, 50));
  // URLSearchParams writes spaces as "+", which some UPI apps show literally.
  return `upi://pay?${q.toString().replace(/\+/g, "%20")}`;
}
