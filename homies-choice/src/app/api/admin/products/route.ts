import { products as starter } from "@/data/products";
import { parseProductInput } from "@/lib/product-schema";
import { adminRoute, json, refreshStorefront } from "@/lib/server/admin-api";
import { fetchAllProducts, productToRow } from "@/lib/server/catalogue-source";
import { db, unwrap } from "@/lib/server/supabase";

export const GET = adminRoute(async () => {
  const all = await fetchAllProducts().catch(() => null);
  return json({ products: all ?? starter, source: all ? "database" : "starter" });
});

export const POST = adminRoute(
  async (req) => {
    const { product, errors } = parseProductInput(await req.json().catch(() => null));
    if (Object.keys(errors).length) return json({ error: "Please fix the highlighted fields.", errors }, 422);
    const client = db();
    const existing = unwrap(await client.from("products").select("slug").eq("slug", product.slug).maybeSingle());
    if (existing) return json({ error: "A product with this web address already exists.", errors: { slug: "Already in use." } }, 409);
    unwrap(await client.from("products").insert(productToRow(product, Math.floor(Date.now() / 1000))));
    refreshStorefront("catalogue");
    return json({ product }, 201);
  },
  { write: true, needsDb: true },
);
