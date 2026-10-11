import { getCatalogue } from "@/lib/server/catalogue-source";
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

export default async function HomePage() {
  const products = await getCatalogue();
  return (
    <>
      <Hero />
      <ServiceStrip />
      <CollectionTiles />
      <Bestsellers products={products} />
      <Discovery />
      <MoodTiles products={products} />
      <BrandShowcase products={products} />
      <WatchesTeaser />
      <WhyUs />
      <ContactSection />
    </>
  );
}
