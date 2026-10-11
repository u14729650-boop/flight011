import { products as starter } from "@/data/products";
import { parseProductInput } from "@/lib/product-schema";
import { adminRoute, json, refreshStorefront } from "@/lib/server/admin-api";
import { fetchAllProducts, productToRow } from "@/lib/server/catalogue-source";
import { rest } from "@/lib/server/supabase";

export const GET = adminRoute(async () => {
  const all = await fetchAllProducts().catch(() => null);
  return json({ products: all ?? starter, source: all ? "database" : "starter" });
});

export const POST = adminRoute(
  async (req) => {
    const { product, errors } = parseProductInput(await req.json().catch(() => null));
    if (Object.keys(errors).length) return json({ error: "Please fix the highlighted fields.", errors }, 422);
    const existing = await rest<{ slug: string }[]>(`products?slug=eq.${encodeURIComponent(product.slug)}&select=slug`, { cache: "no-store" });
    if (existing.length) return json({ error: "A product with this web address already exists.", errors: { slug: "Already in use." } }, 409);
    await rest("products", { method: "POST", body: JSON.stringify(productToRow(product, Date.now() % 2_000_000_000)), headers: { Prefer: "return=minimal" } });
    refreshStorefront("catalogue");
    return json({ product }, 201);
  },
  { write: true, needsDb: true },
);
