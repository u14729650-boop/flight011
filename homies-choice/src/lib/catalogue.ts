import type { Product, ProductCategory } from "@/data/products";
import type { CollectionScope } from "@/data/collections";
import { fragranceFamilies, type FragranceFamily, type Gender, type Origin } from "@/data/taxonomy";

export type SortKey = "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];

export interface CatalogueFilters {
  q: string;
  category: ProductCategory[];
  gender: Gender[];
  origin: Origin[];
  family: FragranceFamily[];
  size: number[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortKey;
}

export const emptyFilters: CatalogueFilters = {
  q: "",
  category: [],
  gender: [],
  origin: [],
  family: [],
  size: [],
  minPrice: null,
  maxPrice: null,
  sort: "featured",
};

const GENDERS: Gender[] = ["men", "women", "unisex"];
const ORIGINS: Origin[] = ["designer", "arabic"];
const CATEGORIES: ProductCategory[] = ["fragrance", "watch"];
const SORTS = sortOptions.map((s) => s.value);

function list(params: URLSearchParams, key: string): string[] {
  return params
    .getAll(key)
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

function num(value: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseFilters(params: URLSearchParams): CatalogueFilters {
  const sort = params.get("sort") as SortKey | null;
  return {
    q: (params.get("q") ?? "").slice(0, 80),
    category: list(params, "cat").filter((c): c is ProductCategory => CATEGORIES.includes(c as ProductCategory)),
    gender: list(params, "gender").filter((g): g is Gender => GENDERS.includes(g as Gender)),
    origin: list(params, "origin").filter((o): o is Origin => ORIGINS.includes(o as Origin)),
    family: list(params, "family").filter((f): f is FragranceFamily => f in fragranceFamilies),
    size: list(params, "size").map(Number).filter((n) => Number.isFinite(n) && n > 0),
    minPrice: num(params.get("min")),
    maxPrice: num(params.get("max")),
    sort: sort && SORTS.includes(sort) ? sort : "featured",
  };
}

export function serializeFilters(filters: CatalogueFilters): string {
  const p = new URLSearchParams();
  if (filters.q.trim()) p.set("q", filters.q.trim());
  if (filters.category.length) p.set("cat", filters.category.join(","));
  if (filters.gender.length) p.set("gender", filters.gender.join(","));
  if (filters.origin.length) p.set("origin", filters.origin.join(","));
  if (filters.family.length) p.set("family", filters.family.join(","));
  if (filters.size.length) p.set("size", filters.size.join(","));
  if (filters.minPrice != null) p.set("min", String(filters.minPrice));
  if (filters.maxPrice != null) p.set("max", String(filters.maxPrice));
  if (filters.sort !== "featured") p.set("sort", filters.sort);
  return p.toString();
}

export function activeFilterCount(f: CatalogueFilters): number {
  return (
    f.category.length +
    f.gender.length +
    f.origin.length +
    f.family.length +
    f.size.length +
    (f.minPrice != null ? 1 : 0) +
    (f.maxPrice != null ? 1 : 0)
  );
}

export function inScope(product: Product, scope: CollectionScope | undefined): boolean {
  if (!scope) return true;
  if (scope.category && product.category !== scope.category) return false;
  if (scope.gender && product.gender !== scope.gender) return false;
  if (scope.origin && product.origin !== scope.origin) return false;
  if (scope.bestseller && !product.bestseller) return false;
  if (scope.mood && !product.moods.includes(scope.mood)) return false;
  return true;
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchesQuery(product: Product, q: string): boolean {
  const query = normalise(q);
  if (!query) return true;
  const haystack = normalise(`${product.brand} ${product.name} ${product.category === "watch" ? "watch watches" : "perfume fragrance"}`);
  return query.split(" ").every((term) => haystack.includes(term));
}

/** Lowest known price across variants, or null when every price is on request. */
export function lowestPrice(product: Product): number | null {
  const prices = product.variants.map((v) => v.price).filter((p): p is number => p != null);
  return prices.length ? Math.min(...prices) : null;
}

export function availableSizes(items: Product[]): number[] {
  const sizes = new Set<number>();
  for (const p of items) for (const v of p.variants) if (v.sizeMl != null) sizes.add(v.sizeMl);
  return [...sizes].sort((a, b) => a - b);
}

export function availableFamilies(items: Product[]): FragranceFamily[] {
  const fams = new Set<FragranceFamily>();
  for (const p of items) for (const f of p.families) fams.add(f);
  return (Object.keys(fragranceFamilies) as FragranceFamily[]).filter((f) => fams.has(f));
}

export function applyFilters(items: Product[], f: CatalogueFilters): Product[] {
  const priceFiltered = f.minPrice != null || f.maxPrice != null;
  const result = items.filter((p) => {
    if (!matchesQuery(p, f.q)) return false;
    if (f.category.length && !f.category.includes(p.category)) return false;
    if (f.gender.length && !f.gender.includes(p.gender)) return false;
    if (f.origin.length && !(p.origin && f.origin.includes(p.origin))) return false;
    if (f.family.length && !f.family.some((fam) => p.families.includes(fam))) return false;
    if (f.size.length && !p.variants.some((v) => v.sizeMl != null && f.size.includes(v.sizeMl))) return false;
    if (priceFiltered) {
      const ok = p.variants.some(
        (v) =>
          v.price != null &&
          (f.minPrice == null || v.price >= f.minPrice) &&
          (f.maxPrice == null || v.price <= f.maxPrice),
      );
      if (!ok) return false;
    }
    return true;
  });

  const byName = (a: Product, b: Product) =>
    `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`, "en", { sensitivity: "base" });
  // Unpriced items always sort after priced ones when sorting by price.
  const byPrice = (dir: 1 | -1) => (a: Product, b: Product) => {
    const pa = lowestPrice(a);
    const pb = lowestPrice(b);
    if (pa == null && pb == null) return byName(a, b);
    if (pa == null) return 1;
    if (pb == null) return -1;
    return (pa - pb) * dir || byName(a, b);
  };

  switch (f.sort) {
    case "price-asc":
      return [...result].sort(byPrice(1));
    case "price-desc":
      return [...result].sort(byPrice(-1));
    case "name-asc":
      return [...result].sort(byName);
    case "name-desc":
      return [...result].sort((a, b) => byName(b, a));
    default:
      return result;
  }
}
