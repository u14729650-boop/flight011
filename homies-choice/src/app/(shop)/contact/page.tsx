import type { Metadata } from "next";
import { getSettings } from "@/lib/server/settings";
import { ContactSection } from "@/components/contact/ContactSection";

export async function generateMetadata(): Promise<Metadata> {
  const { business } = await getSettings();
  return {
    title: `Contact & Store Location — Perfume Shop in ${business.area}, ${business.locality}`,
    description: `Contact Homies Choice, a perfume shop in ${business.area}, ${business.locality}. WhatsApp ${business.whatsapp} for prices, availability and personal fragrance recommendations.`,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  return <ContactSection settings={await getSettings()} headingLevel="h1" />;
}
