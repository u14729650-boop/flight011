import { products as starter } from "@/data/products";
import { starterBanners } from "@/data/banners";
import { adminRoute, json, refreshStorefront } from "@/lib/server/admin-api";
import { bannerToRow } from "@/lib/server/banners";
import { fetchAllProducts, productToRow } from "@/lib/server/catalogue-source";
import { db, unwrap } from "@/lib/server/supabase";

/** Copies the starter catalogue (and starter banners, if none exist) into an empty database. */
export const POST = adminRoute(
  async () => {
    if (await fetchAllProducts()) return json({ error: "The database already has products." }, 409);
    const client = db();
    unwrap(await client.from("products").insert(starter.map((p, i) => productToRow(p, i))));
    const banners = unwrap(await client.from("banners").select("id").limit(1));
    if (!banners?.length) unwrap(await client.from("banners").insert(starterBanners.map(bannerToRow)));
    refreshStorefront("catalogue");
    refreshStorefront("banners");
    return json({ ok: true, count: starter.length });
  },
  { write: true, needsDb: true },
);
