import type { Metadata } from "next";
import { ContactSection } from "@/components/contact/ContactSection";

export const metadata: Metadata = {
  title: "Contact & Store Location — Perfume Shop in Paldi, Ahmedabad",
  description:
    "Contact Homies Choice, a perfume shop in Paldi, Ahmedabad. WhatsApp +91 96620 41440 for prices, availability and personal fragrance recommendations.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <ContactSection headingLevel="h1" />;
}
