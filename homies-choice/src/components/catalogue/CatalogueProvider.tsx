"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Product } from "@/data/products";

const CatalogueContext = createContext<Product[] | null>(null);

/** Makes the live (published) catalogue available to client components. */
export function CatalogueProvider({ products, children }: { products: Product[]; children: ReactNode }) {
  return <CatalogueContext.Provider value={products}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue(): Product[] {
  const ctx = useContext(CatalogueContext);
  if (!ctx) throw new Error("useCatalogue must be used inside <CatalogueProvider>");
  return ctx;
}
