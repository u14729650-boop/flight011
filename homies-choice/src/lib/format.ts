import type { Availability, ProductVariant } from "@/data/products";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatPrice(amount: number): string {
  return inr.format(amount);
}

export function formatSize(sizeMl: number | null): string {
  return sizeMl == null ? "Size to be confirmed" : `${sizeMl} ml`;
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
