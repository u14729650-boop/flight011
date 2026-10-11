import { products as starter } from "@/data/products";
import { adminRoute, json, refreshStorefront } from "@/lib/server/admin-api";
import { fetchAllProducts, productToRow } from "@/lib/server/catalogue-source";
import { rest } from "@/lib/server/supabase";

/** Copies the starter catalogue into an empty database. */
export const POST = adminRoute(
  async () => {
    if (await fetchAllProducts()) return json({ error: "The database already has products." }, 409);
    await rest("products", {
      method: "POST",
      body: JSON.stringify(starter.map((p, i) => productToRow(p, i))),
      headers: { Prefer: "return=minimal" },
    });
    refreshStorefront("catalogue");
    return json({ ok: true, count: starter.length });
  },
  { write: true, needsDb: true },
);
