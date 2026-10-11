import { parseProductInput } from "@/lib/product-schema";
import { adminRoute, json, refreshStorefront } from "@/lib/server/admin-api";
import { productToRow } from "@/lib/server/catalogue-source";
import { rest } from "@/lib/server/supabase";

type Ctx = { params: Promise<{ slug: string }> };

export const PUT = adminRoute(
  async (req: Request, { params }: Ctx) => {
    const { slug } = await params;
    const { product, errors } = parseProductInput(await req.json().catch(() => null));
    if (Object.keys(errors).length) return json({ error: "Please fix the highlighted fields.", errors }, 422);
    if (product.slug !== slug) {
      const clash = await rest<{ slug: string }[]>(`products?slug=eq.${encodeURIComponent(product.slug)}&select=slug`, { cache: "no-store" });
      if (clash.length) return json({ error: "A product with this web address already exists.", errors: { slug: "Already in use." } }, 409);
    }
    const updated = await rest<unknown[]>(`products?slug=eq.${encodeURIComponent(slug)}`, {
      method: "PATCH",
      body: JSON.stringify(productToRow(product)),
      headers: { Prefer: "return=representation" },
    });
    if (!updated.length) return json({ error: "Product not found." }, 404);
    refreshStorefront("catalogue");
    return json({ product });
  },
  { write: true, needsDb: true },
);

export const DELETE = adminRoute(
  async (_req: Request, { params }: Ctx) => {
    const { slug } = await params;
    await rest(`products?slug=eq.${encodeURIComponent(slug)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    refreshStorefront("catalogue");
    return json({ ok: true });
  },
  { write: true, needsDb: true },
);
