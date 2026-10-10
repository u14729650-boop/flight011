import { siteConfig } from "@/config/site";

/**
 * Store policies. Shipping / returns / terms are intentionally limited to what
 * the business has confirmed — replace the bodies with the final policy text.
 */
export interface Policy {
  slug: string;
  title: string;
  updated: string | null;
  body: string[];
}

const contactLine = `For any question, message us on WhatsApp at ${siteConfig.whatsapp.display}.`;

export const policies: Policy[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    updated: null,
    body: [
      `This website is operated by ${siteConfig.name}, ${siteConfig.address.lines.join(", ")}, ${siteConfig.address.locality}, ${siteConfig.address.region}, ${siteConfig.address.country}.`,
      "Your shopping bag is stored only in your own browser (local storage) so it is still there when you come back. It is not sent to us until you choose to share it.",
      "When you use “Order on WhatsApp” or the enquiry form, a pre-written message opens in WhatsApp. Nothing is sent until you press send in WhatsApp; after that, the conversation is handled under WhatsApp's own terms and privacy policy.",
      "If online enquiry storage is enabled, the name, contact number and message you submit through the enquiry form are kept only to reply to you and are never sold.",
      contactLine,
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    updated: null,
    body: [
      "Prices, bottle sizes and availability shown on this website are for information and are confirmed by our team before any order is accepted.",
      "Opening WhatsApp from this website does not confirm an order. An order is confirmed only when our team replies with stock availability, delivery charges and the final payable amount, and you agree to it.",
      "Product photographs are for illustration. Brand names and trademarks belong to their respective owners; their use here describes the products we sell and does not imply an official partnership.",
      "The complete terms of sale are being finalised. " + contactLine,
    ],
  },
  {
    slug: "shipping",
    title: "Shipping Policy",
    updated: null,
    body: [
      "Delivery options, areas served, charges and timelines are confirmed individually on WhatsApp when you place an order enquiry.",
      `You are also welcome to visit us at ${siteConfig.address.lines.join(", ")}, ${siteConfig.address.locality}.`,
      "Our full shipping policy is being finalised. " + contactLine,
    ],
  },
  {
    slug: "returns",
    title: "Returns & Refunds",
    updated: null,
    body: [
      "Our returns and refunds policy is being finalised. Please ask our team about the conditions that apply before you confirm your order.",
      contactLine,
    ],
  },
];

export function getPolicy(slug: string) {
  return policies.find((p) => p.slug === slug);
}
