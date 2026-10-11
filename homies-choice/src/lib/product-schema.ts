import type { Availability, Product, ProductCategory } from "@/data/products";
import { fragranceFamilies, moods, type FragranceFamily, type Gender, type Mood, type Origin } from "@/data/taxonomy";

/** Validation shared by the admin editor (browser) and the admin API (server). */

export type ProductErrors = Record<string, string>;

const CATEGORIES: ProductCategory[] = ["fragrance", "watch"];
const GENDERS: Gender[] = ["men", "women", "unisex"];
const ORIGINS: Origin[] = ["designer", "arabic"];
const AVAIL: Availability[] = ["in_stock", "low_stock", "out_of_stock", "on_request"];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
};
const strList = (v: unknown, max = 30) =>
  (Array.isArray(v) ? v : []).map((x) => str(x, 80)).filter(Boolean).slice(0, max);

/** Normalise untrusted input into a Product, collecting errors. */
export function parseProductInput(raw: unknown, opts: { allowDataImages?: boolean } = {}): { product: Product; errors: ProductErrors } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: ProductErrors = {};

  const category = CATEGORIES.includes(r.category as ProductCategory) ? (r.category as ProductCategory) : "fragrance";
  const brand = str(r.brand, 80);
  const name = str(r.name, 120);
  const slug = slugify(str(r.slug, 80) || `${brand} ${name}`);
  if (!brand) errors.brand = "Enter the brand.";
  if (!name) errors.name = "Enter the product name.";
  if (!slug) errors.slug = "Enter a web address (slug).";

  const gender = GENDERS.includes(r.gender as Gender) ? (r.gender as Gender) : "unisex";
  const origin = category === "fragrance" && ORIGINS.includes(r.origin as Origin) ? (r.origin as Origin) : null;
  if (category === "fragrance" && !origin) errors.origin = "Choose Arabic or designer.";

  const families = category === "fragrance" ? (strList(r.families).filter((f) => f in fragranceFamilies) as FragranceFamily[]) : [];
  const moodList = category === "fragrance" ? (strList(r.moods).filter((m) => m in moods) as Mood[]) : [];

  const description = str(r.description, 1200);
  if (!description) errors.description = "Add a short description.";

  let notes: Product["notes"] = null;
  if (category === "fragrance" && r.notes && typeof r.notes === "object") {
    const n = r.notes as Record<string, unknown>;
    const top = strList(n.top), heart = strList(n.heart), base = strList(n.base);
    if (top.length || heart.length || base.length) {
      notes = { top, heart, base, source: str(n.source, 300) };
      if (!notes.source) errors.notesSource = "Say where the notes were verified (e.g. the brand's page).";
    }
  }

  const specs = (Array.isArray(r.specs) ? r.specs : [])
    .map((s) => ({ label: str((s as Record<string, unknown>)?.label, 60), value: str((s as Record<string, unknown>)?.value, 200) }))
    .filter((s) => s.label && s.value)
    .slice(0, 20);

  const images = (Array.isArray(r.images) ? r.images : [])
    .map((i) => {
      const o = (i ?? {}) as Record<string, unknown>;
      return {
        src: str(o.src, opts.allowDataImages ? 3_000_000 : 600),
        alt: str(o.alt, 200) || `${brand} ${name}`.trim(),
        width: Math.max(1, Math.round(Number(o.width) || 1200)),
        height: Math.max(1, Math.round(Number(o.height) || 1500)),
      };
    })
    .filter((i) => /^(https:\/\/|\/(?!\/))/.test(i.src) || (opts.allowDataImages === true && /^data:image\/(png|jpe?g|webp|avif);base64,/.test(i.src)))
    .slice(0, 8);

  const rawVariants = Array.isArray(r.variants) ? r.variants : [];
  const variants = rawVariants.slice(0, 12).map((v, idx) => {
    const o = (v ?? {}) as Record<string, unknown>;
    const sizeMl = numOrNull(o.sizeMl);
    const price = numOrNull(o.price);
    const compareAtPrice = numOrNull(o.compareAtPrice);
    if (Number.isNaN(sizeMl) || (sizeMl != null && (sizeMl <= 0 || sizeMl > 1000))) errors[`variants.${idx}.sizeMl`] = "Size must be between 1 and 1000 ml.";
    if (Number.isNaN(price) || (price != null && (price < 0 || price > 10_000_000))) errors[`variants.${idx}.price`] = "Enter a valid price in rupees.";
    if (Number.isNaN(compareAtPrice) || (compareAtPrice != null && compareAtPrice < 0)) errors[`variants.${idx}.compareAtPrice`] = "Enter a valid price.";
    if (compareAtPrice != null && (price == null || compareAtPrice <= price))
      errors[`variants.${idx}.compareAtPrice`] = "The comparison price must be higher than the selling price.";
    const label = str(o.label, 80) || null;
    const id = slugify(str(o.id, 80)) || slugify(`${slug}-${label ?? sizeMl ?? idx + 1}`) || `${slug}-${idx + 1}`;
    return {
      id,
      sizeMl: Number.isNaN(sizeMl) ? null : sizeMl,
      label,
      price: Number.isNaN(price) ? null : price,
      compareAtPrice: Number.isNaN(compareAtPrice) ? null : compareAtPrice,
      availability: AVAIL.includes(o.availability as Availability) ? (o.availability as Availability) : "on_request",
    };
  });
  if (!variants.length) errors.variants = "Add at least one size or option.";
  const ids = new Set<string>();
  variants.forEach((v, i) => {
    if (ids.has(v.id)) v.id = `${v.id}-${i + 1}`;
    ids.add(v.id);
  });

  const product: Product = {
    slug,
    category,
    brand,
    name,
    concentration: category === "fragrance" ? str(r.concentration, 60) || null : null,
    gender,
    origin,
    families,
    moods: moodList,
    description,
    notes,
    specs,
    images,
    variants,
    bestseller: Boolean(r.bestseller),
    published: r.published === undefined ? true : Boolean(r.published),
    pendingVerification: str(r.pendingVerification, 300) || undefined,
  };
  return { product, errors };
}
