import { siteConfig } from "@/config/site";
import { addressLines, defaultSettings, policyPages, type PolicySlug, type StoreSettings } from "@/lib/store-settings";

/**
 * Store policies. The standard wording below is limited to what the business has
 * confirmed; the owner can replace any policy's text in Dashboard → Store settings.
 */
export interface Policy {
  slug: PolicySlug;
  title: string;
  updated: string | null;
  body: string[];
  /** True when the owner has written their own text. */
  custom: boolean;
}

export const policies = policyPages;

/** The standard wording, filled in with the current business details. */
export function defaultPolicyBody(slug: PolicySlug, business: StoreSettings["business"]): string[] {
  const contactLine = `For any question, message us on WhatsApp at ${business.whatsapp}.`;
  const [street, city] = addressLines(business);
  switch (slug) {
    case "privacy":
      return [
        `This website is operated by ${siteConfig.name}, ${street}, ${city}, India.`,
        "Your shopping bag is stored only in your own browser (local storage) so it is still there when you come back. It is not sent to us until you choose to share it.",
        "When you use “Order on WhatsApp” or the enquiry form, a pre-written message opens in WhatsApp. Nothing is sent until you press send in WhatsApp; after that, the conversation is handled under WhatsApp's own terms and privacy policy.",
        "When you send an order from the checkout page, a copy of it (the products, the name, delivery area and note you entered, your payment choice and any UPI reference you typed in) is kept so our team can process your order. It is never sold.",
        "If online enquiry storage is enabled, the name, contact number and message you submit through the enquiry form are kept only to reply to you and are never sold.",
        contactLine,
      ];
    case "terms":
      return [
        "Prices, bottle sizes and availability shown on this website are for information and are confirmed by our team before any order is accepted.",
        "Opening WhatsApp from this website does not confirm an order. An order is confirmed only when our team replies with stock availability, delivery charges and the final payable amount, and you agree to it.",
        "Product photographs are for illustration. Brand names and trademarks belong to their respective owners; their use here describes the products we sell and does not imply an official partnership.",
        "The complete terms of sale are being finalised. " + contactLine,
      ];
    case "shipping":
      return [
        "Delivery options, areas served, charges and timelines are confirmed individually on WhatsApp when you place an order enquiry.",
        `You are also welcome to visit us at ${street}, ${business.locality}.`,
        "Our full shipping policy is being finalised. " + contactLine,
      ];
    case "returns":
      return [
        "Our returns and refunds policy is being finalised. Please ask our team about the conditions that apply before you confirm your order.",
        contactLine,
      ];
  }
}

export function getPolicy(slug: string, settings: StoreSettings = defaultSettings): Policy | undefined {
  const page = policyPages.find((p) => p.slug === slug);
  if (!page) return undefined;
  const custom = settings.policies[page.slug].trim();
  return {
    slug: page.slug,
    title: page.title,
    updated: null,
    custom: Boolean(custom),
    body: custom ? custom.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : defaultPolicyBody(page.slug, settings.business),
  };
}
