import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalogue } from "@/components/catalogue/Catalogue";
import { CatalogueFallback } from "@/components/catalogue/CatalogueFallback";
import { PageIntro } from "@/components/ui/PageIntro";

export const metadata: Metadata = {
  title: "Shop All Perfumes",
  description:
    "Browse every fragrance at Homies Choice, Ahmedabad — designer perfumes and Arabic fragrances for men, women and unisex. Search, filter by family or size, and order on WhatsApp.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop All" }]}
        eyebrow="The collection"
        title="Shop all fragrances"
        intro="Designer icons and Arabic favourites — search by name or brand, or refine by family, size and price."
      />
      <Suspense fallback={<CatalogueFallback />}>
        <Catalogue />
      </Suspense>
    </>
  );
}
