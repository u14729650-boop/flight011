/**
 * Website banners, managed in the admin panel (Banners).
 * - "home": the featured carousel under the service bar on the home page.
 * - "shop": a banner at the top of Shop All, collections and Watches.
 * The starter banners below are used until a database is connected; they only
 * point at real pages and make no offers or claims.
 */

export type BannerPlacement = "home" | "shop";
export type BannerTheme = "dark" | "light";

export interface BannerImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Banner {
  id: string;
  placement: BannerPlacement;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  /** Wide image (desktop). */
  image: BannerImage | null;
  /** Optional portrait/square image for phones. */
  mobileImage: BannerImage | null;
  /** Text colour scheme over the image. */
  theme: BannerTheme;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  sortOrder: number;
}

export const placementLabels: Record<BannerPlacement, string> = {
  home: "Home page — featured carousel",
  shop: "Shop pages — top banner",
};

const art = (file: string, alt: string, width: number, height: number): BannerImage => ({ src: `/images/editorial/${file}`, alt, width, height });

export const starterBanners: Banner[] = [
  {
    id: "starter-arabic",
    placement: "home",
    eyebrow: "The Arabic edit",
    title: "Rich, long-lasting Arabic perfumes",
    subtitle: "Lattafa, Afnan, Rasasi, French Avenue and more — ask us for a recommendation.",
    ctaLabel: "Explore Arabic perfumes",
    ctaHref: "/collections/arabic",
    image: art("collection-arabic.jpg", "Amber satin drape", 1000, 1400),
    mobileImage: null,
    theme: "dark",
    startsAt: null,
    endsAt: null,
    active: true,
    sortOrder: 0,
  },
  {
    id: "starter-watches",
    placement: "home",
    eyebrow: "New at Homies Choice",
    title: "Watches, chosen with the same care",
    subtitle: "A considered edit of timepieces to wear with your signature scent.",
    ctaLabel: "Discover watches",
    ctaHref: "/watches",
    image: art("watches-tile.jpg", "Sunburst watch-dial texture", 1400, 1200),
    mobileImage: null,
    theme: "dark",
    startsAt: null,
    endsAt: null,
    active: true,
    sortOrder: 1,
  },
  {
    id: "starter-guidance",
    placement: "shop",
    eyebrow: "Personal guidance",
    title: "Not sure which one? Ask us on WhatsApp.",
    subtitle: "Tell us what you love wearing and we'll suggest what to try next.",
    ctaLabel: "Visit & contact",
    ctaHref: "/contact",
    image: art("mood-elegant-sophisticated.jpg", "Emerald satin", 1400, 1050),
    mobileImage: null,
    theme: "dark",
    startsAt: null,
    endsAt: null,
    active: true,
    sortOrder: 0,
  },
];

/** Active and within its schedule at `now`. */
export function isLive(b: Banner, now = new Date()): boolean {
  if (!b.active) return false;
  if (b.startsAt && new Date(b.startsAt) > now) return false;
  if (b.endsAt && new Date(b.endsAt) <= now) return false;
  return true;
}
