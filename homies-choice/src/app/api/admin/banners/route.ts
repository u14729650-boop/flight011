import { starterBanners } from "@/data/banners";
import { parseBannerInput } from "@/lib/banner-schema";
import { adminRoute, json, refreshStorefront } from "@/lib/server/admin-api";
import { bannerToRow, fetchAllBanners, rowToBanner } from "@/lib/server/banners";
import { db, unwrap } from "@/lib/server/supabase";

export const GET = adminRoute(async () => {
  let all = await fetchAllBanners();
  if (all && !all.length) {
    // Connected but empty: import the starter banners so they become editable (and stay visible).
    unwrap(await db().from("banners").insert(starterBanners.map(bannerToRow)));
    refreshStorefront("banners");
    all = await fetchAllBanners();
  }
  return json({ banners: all ?? starterBanners, source: all ? "database" : "starter" });
});

export const POST = adminRoute(
  async (req) => {
    const { banner, errors } = parseBannerInput(await req.json().catch(() => null));
    if (Object.keys(errors).length) return json({ error: "Please fix the highlighted fields.", errors }, 422);
    const client = db();
    // The site shows the starter banners until the table has rows. On the first save, import them
    // so they don't disappear unexpectedly (they can be switched off or deleted afterwards).
    const any = unwrap(await client.from("banners").select("id").limit(1));
    if (!any?.length) unwrap(await client.from("banners").insert(starterBanners.map(bannerToRow)));
    const siblings = unwrap(await client.from("banners").select("sort_order").eq("placement", banner.placement)) ?? [];
    const next = siblings.reduce((m, b) => Math.max(m, b.sort_order + 1), 0);
    const row = unwrap(await client.from("banners").insert({ ...bannerToRow(banner), sort_order: next }).select("*").single())!;
    refreshStorefront("banners");
    return json({ banner: rowToBanner(row) }, 201);
  },
  { write: true, needsDb: true },
);
