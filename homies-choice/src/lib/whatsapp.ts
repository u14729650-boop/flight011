import { siteConfig } from "@/config/site";
import { productTitle, type Product, type ProductVariant } from "@/data/products";
import type { CartSummary } from "./cart";
import { formatPrice, variantLabel } from "./format";
import { whatsappDigits, type StoreSettings } from "./store-settings";

/** A wa.me link to the shop (or to `number`, digits only), optionally with a pre-written message. */
export function whatsappUrl(message?: string, number: string = siteConfig.whatsapp.number): string {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** WhatsApp links to the number saved in the dashboard (Store settings). */
export const whatsappFor = (settings: Pick<StoreSettings, "business">) => (message?: string) =>
  whatsappUrl(message, whatsappDigits(settings.business.whatsapp));

export function productEnquiryMessage(product: Product, variant: ProductVariant | undefined): string {
  const size = variant ? variantLabel(variant, product.category) : "any option";
  return [
    `Hello ${siteConfig.shortName}, I'd like to know more about this perfume:`,
    "",
    `${productTitle(product)}${product.concentration ? ` (${product.concentration})` : ""}`,
    `${product.category === "watch" ? "Option" : "Size"}: ${size}`,
    "",
    "Could you please share the price and availability?",
  ].join("\n");
}

export interface OrderDetails {
  name?: string;
  area?: string;
  note?: string;
  /** Order reference shared with the dashboard, e.g. HC-7K4Q2M. */
  ref?: string;
  /** Payment choice and anything already paid, one line each. */
  payment?: string[];
}

export function orderMessage(summary: CartSummary, details: OrderDetails = {}): string {
  const out: string[] = [
    details.ref ? `Hello ${siteConfig.shortName}, I'd like to place an order (ref ${details.ref}).` : `Hello ${siteConfig.shortName}, I'd like to place an order enquiry.`,
    "",
  ];
  const name = details.name?.trim();
  const area = details.area?.trim();
  if (name) out.push(`Name: ${name}`);
  if (area) out.push(`Delivery area: ${area}`);
  if (name || area) out.push("");

  summary.lines.forEach((line, i) => {
    const price = line.lineTotal == null ? "price to be confirmed" : formatPrice(line.lineTotal);
    out.push(`${i + 1}. ${productTitle(line.product)} — ${variantLabel(line.variant, line.product.category)} × ${line.qty} — ${price}`);
  });
  out.push("");

  if (summary.unpricedLines === summary.lines.length) {
    out.push("Product subtotal: to be confirmed");
  } else if (summary.unpricedLines > 0) {
    out.push(
      `Product subtotal: ${formatPrice(summary.subtotal)} (plus ${summary.unpricedLines} item${
        summary.unpricedLines > 1 ? "s" : ""
      } awaiting price)`,
    );
  } else {
    out.push(`Product subtotal: ${formatPrice(summary.subtotal)}`);
  }

  if (details.payment?.length) out.push("", ...details.payment);

  const note = details.note?.trim();
  if (note) out.push("", `Note: ${note}`);

  out.push("", "Please confirm stock availability, delivery charges and the final payable amount. Thank you!");
  return out.join("\n");
}

export function contactMessage(input: { name: string; phone: string; message: string }): string {
  return [
    `Hello ${siteConfig.shortName}, I have an enquiry.`,
    "",
    `Name: ${input.name.trim()}`,
    `Contact number: ${input.phone.trim()}`,
    "",
    input.message.trim(),
  ].join("\n");
}
