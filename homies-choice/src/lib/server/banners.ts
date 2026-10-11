import { isLive, starterBanners, type Banner, type BannerPlacement } from "@/data/banners";
import type { BannerRow } from "./database.types";
import { BANNERS_TAG, db, supabaseConfigured, unwrap } from "./supabase";

export function rowToBanner(r: BannerRow): Banner {
  return {
    id: r.id,
    placement: r.placement,
    eyebrow: r.eyebrow,
    title: r.title,
    subtitle: r.subtitle,
    ctaLabel: r.cta_label,
    ctaHref: r.cta_href,
    image: r.image,
    mobileImage: r.mobile_image,
    theme: r.theme,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    active: r.is_active,
    sortOrder: r.sort_order,
  };
}

export function bannerToRow(b: Banner) {
  return {
    placement: b.placement,
    eyebrow: b.eyebrow,
    title: b.title,
    subtitle: b.subtitle,
    cta_label: b.ctaLabel,
    cta_href: b.ctaHref,
    image: b.image,
    mobile_image: b.mobileImage,
    theme: b.theme,
    starts_at: b.startsAt,
    ends_at: b.endsAt,
    is_active: b.active,
    sort_order: b.sortOrder,
  };
}

const COLUMNS = "id,placement,eyebrow,title,subtitle,cta_label,cta_href,image,mobile_image,theme,starts_at,ends_at,is_active,sort_order,created_at,updated_at";

/** All banners for the admin (fresh). Null when no database is connected. */
export async function fetchAllBanners(): Promise<Banner[] | null> {
  if (!supabaseConfigured()) return null;
  const rows = unwrap(await db().from("banners").select(COLUMNS).order("placement").order("sort_order", { ascending: true })) as BannerRow[];
  return rows.map(rowToBanner);
}

/**
 * Live banners for a placement (cached with the "banners" tag).
 * Falls back to the starter banners until the database has its own.
 */
export async function getBanners(placement: BannerPlacement): Promise<Banner[]> {
  let all: Banner[] = starterBanners;
  if (supabaseConfigured()) {
    try {
      const rows = unwrap(await db({ tags: [BANNERS_TAG] }).from("banners").select(COLUMNS).order("sort_order", { ascending: true })) as BannerRow[];
      if (rows.length) all = rows.map(rowToBanner);
    } catch (err) {
      console.error("Banner fetch failed, using starter banners", err);
    }
  }
  const now = new Date();
  return all.filter((b) => b.placement === placement && isLive(b, now)).sort((a, b) => a.sortOrder - b.sortOrder);
}
