/**
 * Central business configuration. Everything a shop owner is likely to change
 * (announcement text, contact details, social links) lives here.
 */

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "HOMIES CHOICE",
  shortName: "Homies Choice",
  tagline: "Your scent. Your signature.",
  description:
    "Homies Choice is a perfume shop in Ahmedabad for designer fragrances and Arabic perfumes — discover men's, women's and unisex scents and order easily on WhatsApp.",
  url: resolveSiteUrl(),

  /** Slim bar above the navigation. Set `enabled: false` to hide it. */
  announcement: {
    enabled: true,
    text: "Discover your signature scent — explore the world of fragrance",
    href: "/shop" as string | null,
  },

  /**
   * Official logo, cut out of the brand board (brand/homies-choice-brand-board.jpg)
   * as transparent PNGs. Intended for dark (emerald / forest) backgrounds.
   */
  logo: {
    monogram: { src: "/images/brand/hc-monogram.png", width: 307, height: 341 },
    wordmark: { src: "/images/brand/hc-wordmark.png", width: 777, height: 63 },
    stacked: { src: "/images/brand/hc-logo-stacked.png", width: 777, height: 444 },
  },

  owner: "Zakir Kazi",
  whatsapp: {
    /** International format, digits only — used for wa.me links. */
    number: "919662041440",
    display: "+91 96620 41440",
  },
  address: {
    lines: ["Paldi Congress Bhavan", "Near Banas Flat"],
    locality: "Ahmedabad",
    region: "Gujarat",
    country: "India",
    countryCode: "IN",
    /** A search link, not exact coordinates — replace with the verified Google Business link when available. */
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent("Paldi Congress Bhavan, Near Banas Flat, Paldi, Ahmedabad, Gujarat"),
  },

  /** Add the profile URL once supplied, e.g. "https://www.instagram.com/homieschoice". */
  instagram: null as string | null,

  currency: "INR",
  locale: "en-IN",
} as const;

export const navigation = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/shop" },
  { label: "Men's Fragrances", href: "/collections/men" },
  { label: "Women's Fragrances", href: "/collections/women" },
  { label: "Unisex", href: "/collections/unisex" },
  { label: "Arabic Perfumes", href: "/collections/arabic" },
  { label: "Watches", href: "/watches" },
  { label: "Bestsellers", href: "/collections/bestsellers" },
  { label: "Contact", href: "/contact" },
] as const;
