import type { FragranceFamily, Gender, Mood, Origin } from "./taxonomy";

/**
 * PRODUCT CATALOGUE
 * -----------------
 * This file is the single source of truth for the shop. To add or update a
 * perfume, edit an entry below — no design changes are needed.
 *
 * Accuracy rules (please keep them):
 *  - `price` stays `null` until the selling price is confirmed. The site then
 *    shows "Price on request" and the WhatsApp order asks the team to quote.
 *  - `compareAtPrice` only when a genuine earlier/comparison price exists.
 *  - `notes` stays `null` until verified against the brand's own listing.
 *  - `images` stays empty until an authentic product photograph is available;
 *    a clearly labelled placeholder is shown meanwhile. Put photographs in
 *    /public/images/products/<slug>/ and reference them here.
 *  - `availability` stays "on_request" until stock is confirmed.
 */

export type Availability = "in_stock" | "low_stock" | "out_of_stock" | "on_request";

export type ProductCategory = "fragrance" | "watch";

export const categoryLabels: Record<ProductCategory, string> = {
  fragrance: "Fragrance",
  watch: "Watch",
};

export interface ProductVariant {
  id: string;
  /** Bottle size in millilitres (fragrances); null while unconfirmed or not applicable. */
  sizeMl: number | null;
  /** Free-text option name, e.g. "Black dial · Steel bracelet" (watches). Overrides the size label. */
  label?: string | null;
  /** Selling price in Indian rupees; null = price on request. */
  price: number | null;
  /** Genuine comparison price in rupees, only when one exists. */
  compareAtPrice: number | null;
  availability: Availability;
}

export interface ProductImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface FragranceNotes {
  top: string[];
  heart: string[];
  base: string[];
  /** Where the notes were verified, e.g. the brand's product page URL. */
  source: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  slug: string;
  category: ProductCategory;
  brand: string;
  name: string;
  /** Fragrance concentration, e.g. "Eau de Parfum"; null for watches. */
  concentration: string | null;
  gender: Gender;
  /** Arabic / designer — fragrances only. */
  origin: Origin | null;
  /** Editorial classification used for filtering. Empty = not yet classified. */
  families: FragranceFamily[];
  moods: Mood[];
  description: string;
  notes: FragranceNotes | null;
  /** Verified specifications shown on the product page (e.g. movement, case size for watches). */
  specs: ProductSpec[];
  images: ProductImage[];
  variants: ProductVariant[];
  bestseller: boolean;
  /** Hidden from the shop when false (admin drafts). */
  published: boolean;
  /** Shown to the shop team only (README / data) — what still needs checking. */
  pendingVerification?: string;
}

/** Starter catalogue. Used as-is when no database is connected, and to seed the database from the admin panel. */
export const products: Product[] = [
  {
    category: "fragrance",
    specs: [],
    published: true,
    slug: "lattafa-khamrah",
    brand: "Lattafa",
    name: "Khamrah",
    concentration: "Eau de Parfum",
    gender: "unisex",
    origin: "arabic",
    families: ["amber", "spicy", "gourmand"],
    moods: ["warm-spicy", "sweet-gourmand", "bold-intense"],
    description:
      "One of the most talked-about Arabic fragrances of recent years — a warm, spiced and richly sweet composition from the Dubai house of Lattafa, made for evenings and cooler days.",
    notes: null,
    images: [],
    variants: [{ id: "lattafa-khamrah-100", sizeMl: 100, price: null, compareAtPrice: null, availability: "on_request" }],
    bestseller: true,
    pendingVerification: "Selling price, stock and product photograph.",
  },
  {
    category: "fragrance",
    specs: [],
    published: true,
    slug: "french-avenue-liquid-brun",
    brand: "French Avenue",
    name: "Liquid Brun",
    concentration: "Eau de Parfum",
    gender: "men",
    origin: "arabic",
    families: ["amber", "gourmand", "spicy"],
    moods: ["sweet-gourmand", "warm-spicy", "elegant-sophisticated"],
    description:
      "A smooth, warm and polished fragrance from French Avenue, with a creamy sweetness that sits close to the skin and lingers beautifully.",
    notes: null,
    images: [],
    variants: [{ id: "french-avenue-liquid-brun-100", sizeMl: 100, price: null, compareAtPrice: null, availability: "on_request" }],
    bestseller: true,
    pendingVerification: "Selling price, stock and product photograph.",
  },
  {
    category: "fragrance",
    specs: [],
    published: true,
    slug: "emporio-armani-stronger-with-you-intensely",
    brand: "Emporio Armani",
    name: "Stronger With You Intensely",
    concentration: "Eau de Parfum",
    gender: "men",
    origin: "designer",
    families: ["amber", "spicy", "gourmand"],
    moods: ["warm-spicy", "sweet-gourmand", "bold-intense"],
    description:
      "The deeper, more intense interpretation of Emporio Armani's Stronger With You — a modern designer favourite with a warm, sweet and spiced signature.",
    notes: null,
    images: [],
    variants: [
      { id: "ea-swy-intensely-50", sizeMl: 50, price: null, compareAtPrice: null, availability: "on_request" },
      { id: "ea-swy-intensely-100", sizeMl: 100, price: null, compareAtPrice: null, availability: "on_request" },
    ],
    bestseller: true,
    pendingVerification: "Which sizes are stocked, selling prices and product photograph.",
  },
  {
    category: "fragrance",
    specs: [],
    published: true,
    slug: "rayhaan",
    brand: "Rayhaan",
    name: "Rayhaan",
    concentration: null,
    gender: "unisex",
    origin: "arabic",
    families: [],
    moods: [],
    description:
      "A fragrance from the Rayhaan house. Ask us on WhatsApp for the exact scent, size and availability currently in store.",
    notes: null,
    images: [],
    variants: [{ id: "rayhaan-std", sizeMl: null, price: null, compareAtPrice: null, availability: "on_request" }],
    bestseller: true,
    pendingVerification:
      "Exact fragrance name within the Rayhaan range, gender, concentration, bottle size, price, classification and photograph.",
  },
  {
    category: "fragrance",
    specs: [],
    published: true,
    slug: "rasasi-hawas-for-him",
    brand: "Rasasi",
    name: "Hawas for Him",
    concentration: "Eau de Parfum",
    gender: "men",
    origin: "arabic",
    families: ["fresh", "aquatic", "aromatic"],
    moods: ["fresh-aquatic"],
    description:
      "Rasasi's celebrated fresh signature — bright, aquatic and effortlessly wearable, a natural choice for warm Ahmedabad days.",
    notes: null,
    images: [],
    variants: [{ id: "rasasi-hawas-him-100", sizeMl: 100, price: null, compareAtPrice: null, availability: "on_request" }],
    bestseller: true,
    pendingVerification: "Selling price, stock and product photograph.",
  },
  {
    category: "fragrance",
    specs: [],
    published: true,
    slug: "afnan-9-pm",
    brand: "Afnan",
    name: "9 PM",
    concentration: "Eau de Parfum",
    gender: "men",
    origin: "arabic",
    families: ["amber", "gourmand", "spicy"],
    moods: ["sweet-gourmand", "warm-spicy", "bold-intense"],
    description:
      "A sweet, warm evening fragrance from Afnan with a confident trail — made for nights out, as its name suggests.",
    notes: null,
    images: [],
    variants: [{ id: "afnan-9pm-100", sizeMl: 100, price: null, compareAtPrice: null, availability: "on_request" }],
    bestseller: true,
    pendingVerification: "Selling price, stock and product photograph.",
  },
  {
    category: "fragrance",
    specs: [],
    published: true,
    slug: "lattafa-asad-bourbon",
    brand: "Lattafa",
    name: "Asad Bourbon",
    concentration: "Eau de Parfum",
    gender: "men",
    origin: "arabic",
    families: ["amber", "spicy"],
    moods: ["warm-spicy", "bold-intense"],
    description:
      "A richer, warmer take on Lattafa's popular Asad — deep, spiced and made to be noticed.",
    notes: null,
    images: [],
    variants: [{ id: "lattafa-asad-bourbon-100", sizeMl: 100, price: null, compareAtPrice: null, availability: "on_request" }],
    bestseller: true,
    pendingVerification: "Selling price, stock, classification check and product photograph.",
  },
];

export function findProduct(catalogue: Product[], slug: string): Product | undefined {
  return catalogue.find((p) => p.slug === slug);
}

/** @deprecated use findProduct with the live catalogue */
export function getProduct(slug: string): Product | undefined {
  return findProduct(products, slug);
}

export function getVariant(product: Product, variantId: string): ProductVariant | undefined {
  return product.variants.find((v) => v.id === variantId);
}

export function productTitle(product: Pick<Product, "brand" | "name">): string {
  return product.brand === product.name ? product.name : `${product.brand} ${product.name}`;
}
