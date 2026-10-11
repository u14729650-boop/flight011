import { products as starterCatalogue, type Product } from "@/data/products";
import type { FragranceFamily, Mood } from "@/data/taxonomy";
import type { ProductRow } from "./database.types";
import { CATALOGUE_TAG, db, supabaseConfigured, unwrap } from "./supabase";

/**
 * Catalogue for the storefront.
 * - Supabase connected and seeded → published products from the database
 *   (cached with the "catalogue" tag, refreshed instantly when the admin saves).
 * - Otherwise → the starter catalogue in src/data/products.ts.
 */

export function rowToProduct(r: ProductRow): Product {
  return {
    slug: r.slug,
    category: r.category,
    brand: r.brand,
    name: r.name,
    concentration: r.concentration,
    gender: r.gender,
    origin: r.origin,
    families: (r.families ?? []) as FragranceFamily[],
    moods: (r.moods ?? []) as Mood[],
    description: r.description ?? "",
    notes: r.notes ?? null,
    specs: r.specs ?? [],
    images: r.images ?? [],
    variants: r.variants ?? [],
    bestseller: r.bestseller,
    published: r.is_published,
    pendingVerification: r.pending_verification ?? undefined,
  };
}

export function productToRow(p: Product, sortOrder?: number) {
  return {
    slug: p.slug,
    category: p.category,
    brand: p.brand,
    name: p.name,
    concentration: p.concentration,
    gender: p.gender,
    origin: p.origin,
    families: p.families,
    moods: p.moods,
    description: p.description,
    notes: p.notes,
    specs: p.specs,
    images: p.images,
    variants: p.variants,
    bestseller: p.bestseller,
    is_published: p.published,
    pending_verification: p.pendingVerification ?? null,
    ...(sortOrder != null ? { sort_order: sortOrder } : {}),
  };
}

// Only the columns the site uses (smaller, faster responses).
const PRODUCT_COLUMNS =
  "slug,category,brand,name,concentration,gender,origin,families,moods,description,notes,specs,images,variants,bestseller,is_published,pending_verification,sort_order";

/** Every product, including drafts (admin only). Null when the database is empty or unavailable. */
export async function fetchAllProducts(): Promise<Product[] | null> {
  if (!supabaseConfigured()) return null;
  const rows = unwrap(
    await db().from("products").select(PRODUCT_COLUMNS).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
  ) as ProductRow[];
  return rows.length ? rows.map(rowToProduct) : null;
}

/** Published catalogue for the storefront (cached). */
export async function getCatalogue(): Promise<Product[]> {
  if (!supabaseConfigured()) return starterCatalogue;
  try {
    const client = db({ tags: [CATALOGUE_TAG] });
    const [published, any] = await Promise.all([
      client.from("products").select(PRODUCT_COLUMNS).eq("is_published", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      client.from("products").select("slug").limit(1),
    ]);
    if (!(unwrap(any) as unknown[]).length) return starterCatalogue; // not seeded yet
    return (unwrap(published) as ProductRow[]).map(rowToProduct);
  } catch (err) {
    console.error("Catalogue fetch failed, using starter catalogue", err);
    return starterCatalogue;
  }
}

export async function getCatalogueProduct(slug: string): Promise<Product | undefined> {
  return (await getCatalogue()).find((p) => p.slug === slug);
}
