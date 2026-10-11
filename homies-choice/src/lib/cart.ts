import { findProduct, getVariant, productTitle, type Product, type ProductVariant } from "@/data/products";

export const MAX_QTY = 10;
export const CART_STORAGE_KEY = "hc-bag-v1";

export interface CartItem {
  slug: string;
  variantId: string;
  qty: number;
}

export interface CartLine {
  key: string;
  product: Product;
  variant: ProductVariant;
  qty: number;
  /** price × qty, or null when the price is on request. */
  lineTotal: number | null;
}

export interface CartSummary {
  lines: CartLine[];
  itemCount: number;
  /** Sum of all lines that have a confirmed price. */
  subtotal: number;
  /** Number of lines whose price still needs to be confirmed. */
  unpricedLines: number;
}

export function lineKey(slug: string, variantId: string): string {
  return `${slug}::${variantId}`;
}

export function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(MAX_QTY, Math.max(1, Math.floor(qty)));
}

export function addItem(items: CartItem[], slug: string, variantId: string, qty = 1): CartItem[] {
  const existing = items.find((i) => i.slug === slug && i.variantId === variantId);
  if (existing) {
    return items.map((i) => (i === existing ? { ...i, qty: clampQty(i.qty + qty) } : i));
  }
  return [...items, { slug, variantId, qty: clampQty(qty) }];
}

export function setQty(items: CartItem[], key: string, qty: number): CartItem[] {
  if (qty <= 0) return removeItem(items, key);
  return items.map((i) => (lineKey(i.slug, i.variantId) === key ? { ...i, qty: clampQty(qty) } : i));
}

export function removeItem(items: CartItem[], key: string): CartItem[] {
  return items.filter((i) => lineKey(i.slug, i.variantId) !== key);
}

/** Change the bottle size of a line, merging with an existing line of that size. */
export function changeVariant(items: CartItem[], key: string, newVariantId: string): CartItem[] {
  const item = items.find((i) => lineKey(i.slug, i.variantId) === key);
  if (!item || item.variantId === newVariantId) return items;
  const without = removeItem(items, key);
  return addItem(without, item.slug, newVariantId, item.qty);
}

/** Drop anything that no longer exists in the catalogue or has invalid data. */
export function sanitize(raw: unknown, catalogue: Product[]): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { slug, variantId, qty } = entry as Record<string, unknown>;
    if (typeof slug !== "string" || typeof variantId !== "string" || typeof qty !== "number") continue;
    const product = findProduct(catalogue, slug);
    if (!product || !getVariant(product, variantId)) continue;
    const merged = addItem(out, slug, variantId, qty);
    out.splice(0, out.length, ...merged);
  }
  return out;
}

export function summarize(items: CartItem[], catalogue: Product[]): CartSummary {
  const lines: CartLine[] = [];
  for (const item of items) {
    const product = findProduct(catalogue, item.slug);
    const variant = product && getVariant(product, item.variantId);
    if (!product || !variant) continue;
    lines.push({
      key: lineKey(item.slug, item.variantId),
      product,
      variant,
      qty: item.qty,
      lineTotal: variant.price == null ? null : variant.price * item.qty,
    });
  }
  return {
    lines,
    itemCount: lines.reduce((n, l) => n + l.qty, 0),
    subtotal: lines.reduce((sum, l) => sum + (l.lineTotal ?? 0), 0),
    unpricedLines: lines.filter((l) => l.lineTotal == null).length,
  };
}

export function lineLabel(line: Pick<CartLine, "product">): string {
  return productTitle(line.product);
}
