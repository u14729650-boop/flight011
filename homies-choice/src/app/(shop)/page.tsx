import { getCatalogue } from "@/lib/server/catalogue-source";
import { getBanners } from "@/lib/server/banners";
import { BannerCarousel } from "@/components/banners/BannerCarousel";
import { Hero } from "@/components/home/Hero";
import { ServiceStrip } from "@/components/home/ServiceStrip";
import { CollectionTiles } from "@/components/home/CollectionTiles";
import { Bestsellers } from "@/components/home/Bestsellers";
import { Discovery } from "@/components/home/Discovery";
import { MoodTiles } from "@/components/home/MoodTiles";
import { WatchesTeaser } from "@/components/home/WatchesTeaser";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { WhyUs } from "@/components/home/WhyUs";
import { ContactSection } from "@/components/contact/ContactSection";
import { getSettings } from "@/lib/server/settings";

export default async function HomePage() {
  const [products, banners, settings] = await Promise.all([getCatalogue(), getBanners("home"), getSettings()]);
  // Each section can be switched off in Dashboard → Home page.
  const on = settings.home.sections;
  return (
    <>
      <Hero products={products} settings={settings} />
      {on.services && <ServiceStrip settings={settings} />}
      {on.banners && <BannerCarousel banners={banners} label="Featured at Homies Choice" />}
      {on.collections && <CollectionTiles />}
      {on.bestsellers && <Bestsellers products={products} settings={settings} />}
      {on.story && <Discovery />}
      {on.moods && <MoodTiles products={products} settings={settings} />}
      {on.brands && <BrandShowcase products={products} />}
      {on.watches && <WatchesTeaser />}
      {on.why && <WhyUs />}
      {on.contact && <ContactSection settings={settings} />}
    </>
  );
}
