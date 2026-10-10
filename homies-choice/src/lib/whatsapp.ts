import { siteConfig } from "@/config/site";
import { productTitle, type Product, type ProductVariant } from "@/data/products";
import type { CartSummary } from "./cart";
import { formatPrice, formatSize } from "./format";

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsapp.number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function productEnquiryMessage(product: Product, variant: ProductVariant | undefined): string {
  const size = variant ? formatSize(variant.sizeMl) : "any size";
  return [
    `Hello ${siteConfig.shortName}, I'd like to know more about this perfume:`,
    "",
    `${productTitle(product)}${product.concentration ? ` (${product.concentration})` : ""}`,
    `Size: ${size}`,
    "",
    "Could you please share the price and availability?",
  ].join("\n");
}

export interface OrderDetails {
  name?: string;
  area?: string;
  note?: string;
}

export function orderMessage(summary: CartSummary, details: OrderDetails = {}): string {
  const out: string[] = [`Hello ${siteConfig.shortName}, I'd like to place an order enquiry.`, ""];
  const name = details.name?.trim();
  const area = details.area?.trim();
  if (name) out.push(`Name: ${name}`);
  if (area) out.push(`Delivery area: ${area}`);
  if (name || area) out.push("");

  summary.lines.forEach((line, i) => {
    const price = line.lineTotal == null ? "price to be confirmed" : formatPrice(line.lineTotal);
    out.push(`${i + 1}. ${productTitle(line.product)} — ${formatSize(line.variant.sizeMl)} × ${line.qty} — ${price}`);
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
