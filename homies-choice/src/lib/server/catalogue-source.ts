import { products as starterCatalogue, type Product } from "@/data/products";
import { CATALOGUE_TAG, rest, supabaseConfigured } from "./supabase";

/**
 * Catalogue for the storefront.
 * - Supabase connected and seeded → published products from the database
 *   (cached, refreshed instantly when the admin saves).
 * - Otherwise → the starter catalogue in src/data/products.ts.
 */

interface ProductRow {
  slug: string;
  category: Product["category"];
  brand: string;
  name: string;
  concentration: string | null;
  gender: Product["gender"];
  origin: Product["origin"];
  families: Product["families"];
  moods: Product["moods"];
  description: string;
  notes: Product["notes"];
  specs: Product["specs"];
  images: Product["images"];
  variants: Product["variants"];
  bestseller: boolean;
  is_published: boolean;
  pending_verification: string | null;
  sort_order: number;
}

export function rowToProduct(r: ProductRow): Product {
  return {
    slug: r.slug,
    category: r.category,
    brand: r.brand,
    name: r.name,
    concentration: r.concentration,
    gender: r.gender,
    origin: r.origin,
    families: r.families ?? [],
    moods: r.moods ?? [],
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

export function productToRow(p: Product, sortOrder?: number): Omit<ProductRow, "sort_order"> & { sort_order?: number; updated_at: string } {
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
    updated_at: new Date().toISOString(),
  };
}

/** Every product, including drafts (admin only). Null when the database is empty or unavailable. */
export async function fetchAllProducts(): Promise<Product[] | null> {
  if (!supabaseConfigured()) return null;
  const rows = await rest<ProductRow[]>("products?select=*&order=sort_order.asc,created_at.asc", { cache: "no-store" });
  return rows.length ? rows.map(rowToProduct) : null;
}

/** Published catalogue for the storefront. */
export async function getCatalogue(): Promise<Product[]> {
  if (!supabaseConfigured()) return starterCatalogue;
  try {
    const rows = await rest<ProductRow[]>("products?select=*&order=sort_order.asc,created_at.asc", {
      next: { tags: [CATALOGUE_TAG], revalidate: 600 },
    });
    if (!rows.length) return starterCatalogue; // not seeded yet
    return rows.map(rowToProduct).filter((p) => p.published);
  } catch (err) {
    console.error("Catalogue fetch failed, using starter catalogue", err);
    return starterCatalogue;
  }
}

export async function getCatalogueProduct(slug: string): Promise<Product | undefined> {
  return (await getCatalogue()).find((p) => p.slug === slug);
}
