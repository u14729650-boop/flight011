import type { Product } from "@/data/products";
import { genderLabels, originLabels } from "@/data/taxonomy";
import { formatSize } from "./format";

/** "Eau de Parfum · Men · Arabic" */
export function categoryLine(p: Product): string {
  return [p.concentration, genderLabels[p.gender], originLabels[p.origin]].filter(Boolean).join(" · ");
}

export function sizesLine(p: Product): string {
  return p.variants.map((v) => formatSize(v.sizeMl)).join(" / ");
}

/** The variant a card shows/adds by default: first one that can be bought. */
export function defaultVariant(p: Product) {
  return p.variants.find((v) => v.availability !== "out_of_stock") ?? p.variants[0];
}
