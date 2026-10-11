import type { Availability, ProductVariant } from "@/data/products";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatPrice(amount: number): string {
  return inr.format(amount);
}

export function formatSize(sizeMl: number | null): string {
  return sizeMl == null ? "Size to be confirmed" : `${sizeMl} ml`;
}

/** Human label for a variant: its own label, else bottle size, else a sensible default. */
export function variantLabel(v: Pick<ProductVariant, "label" | "sizeMl">, category: "fragrance" | "watch" = "fragrance"): string {
  if (v.label && v.label.trim()) return v.label.trim();
  if (v.sizeMl != null) return `${v.sizeMl} ml`;
  return category === "watch" ? "Standard" : "Size to be confirmed";
}

export const availabilityLabel: Record<Availability, string> = {
  in_stock: "In stock",
  low_stock: "Only a few left",
  out_of_stock: "Out of stock",
  on_request: "Availability on request",
};

export function canPurchase(variant: ProductVariant): boolean {
  return variant.availability !== "out_of_stock";
}

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
