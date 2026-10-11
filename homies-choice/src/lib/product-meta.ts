import type { Product } from "@/data/products";
import { genderLabels, originLabels } from "@/data/taxonomy";
import { variantLabel } from "./format";

/** "Eau de Parfum · Men · Arabic" */
export function categoryLine(p: Product): string {
  if (p.category === "watch") return ["Watch", genderLabels[p.gender]].join(" · ");
  return [p.concentration, genderLabels[p.gender], p.origin ? originLabels[p.origin] : null].filter(Boolean).join(" · ");
}

export function optionNoun(p: Pick<Product, "category">): string {
  return p.category === "watch" ? "Option" : "Bottle size";
}

export function sizesLine(p: Product): string {
  return p.variants.map((v) => variantLabel(v, p.category)).join(" / ");
}

/** The variant a card shows/adds by default: first one that can be bought. */
export function defaultVariant(p: Product) {
  return p.variants.find((v) => v.availability !== "out_of_stock") ?? p.variants[0];
}
