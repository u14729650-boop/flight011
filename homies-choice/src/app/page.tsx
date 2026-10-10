import { Hero } from "@/components/home/Hero";
import { CollectionTiles } from "@/components/home/CollectionTiles";
import { Bestsellers } from "@/components/home/Bestsellers";
import { Discovery } from "@/components/home/Discovery";
import { MoodTiles } from "@/components/home/MoodTiles";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { WhyUs } from "@/components/home/WhyUs";
import { ContactSection } from "@/components/contact/ContactSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CollectionTiles />
      <Bestsellers />
      <Discovery />
      <MoodTiles />
      <BrandShowcase />
      <WhyUs />
      <ContactSection />
    </>
  );
}
