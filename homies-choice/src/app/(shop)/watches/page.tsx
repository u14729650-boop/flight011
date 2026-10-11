import type { Metadata } from "next";
import { Suspense } from "react";
import { getBanners } from "@/lib/server/banners";
import { BannerCarousel } from "@/components/banners/BannerCarousel";
import { Catalogue } from "@/components/catalogue/Catalogue";
import { CatalogueFallback } from "@/components/catalogue/CatalogueFallback";
import { WatchesIntro } from "@/components/watches/WatchesIntro";

export const metadata: Metadata = {
  title: "Watches in Ahmedabad",
  description:
    "Shop watches at Homies Choice, Ahmedabad — timepieces for men and women, chosen with the same care as our fragrances. Ask for prices and availability on WhatsApp.",
  alternates: { canonical: "/watches" },
};

export default async function WatchesPage() {
  const banners = await getBanners("shop");
  return (
    <>
      <WatchesIntro />
      <BannerCarousel banners={banners} variant="shop" label="Shop news" />
      <Suspense fallback={<CatalogueFallback />}>
        <Catalogue
          scope={{ category: "watch" }}
          emptyCopy={{
            eyebrow: "The watch edit",
            title: "Our first timepieces are arriving.",
            body: "We're preparing a small, considered selection of watches. Message us to hear what's in store now, or to ask us to source a particular model.",
            ask: "Hello Homies Choice, I'd like to know which watches you have available.",
          }}
        />
      </Suspense>
    </>
  );
}
