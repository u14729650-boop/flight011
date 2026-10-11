import { parseProductInput } from "@/lib/product-schema";
import { adminRoute, json, refreshStorefront } from "@/lib/server/admin-api";
import { productToRow } from "@/lib/server/catalogue-source";
import { db, unwrap } from "@/lib/server/supabase";

type Ctx = { params: Promise<{ slug: string }> };

export const PUT = adminRoute(
  async (req: Request, { params }: Ctx) => {
    const { slug } = await params;
    const { product, errors } = parseProductInput(await req.json().catch(() => null));
    if (Object.keys(errors).length) return json({ error: "Please fix the highlighted fields.", errors }, 422);
    const client = db();
    if (product.slug !== slug) {
      const clash = unwrap(await client.from("products").select("slug").eq("slug", product.slug).maybeSingle());
      if (clash) return json({ error: "A product with this web address already exists.", errors: { slug: "Already in use." } }, 409);
    }
    const updated = unwrap(await client.from("products").update(productToRow(product)).eq("slug", slug).select("slug"));
    if (!updated?.length) return json({ error: "Product not found." }, 404);
    refreshStorefront("catalogue");
    return json({ product });
  },
  { write: true, needsDb: true },
);

export const DELETE = adminRoute(
  async (_req: Request, { params }: Ctx) => {
    const { slug } = await params;
    unwrap(await db().from("products").delete().eq("slug", slug));
    refreshStorefront("catalogue");
    return json({ ok: true });
  },
  { write: true, needsDb: true },
);
