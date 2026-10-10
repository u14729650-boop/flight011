import { describe, expect, it } from "vitest";
import { validateEnquiry } from "@/lib/validation";
import { products } from "@/data/products";
import { collections } from "@/data/collections";
import { productEnquiryMessage, whatsappUrl } from "@/lib/whatsapp";
import { productJsonLd } from "@/lib/seo";

describe("enquiry validation", () => {
  it("accepts a valid enquiry", () => {
    expect(validateEnquiry({ name: "Aman", phone: "+91 98765 43210", message: "Do you have Khamrah in stock?" })).toEqual({});
  });
  it("rejects missing / invalid fields", () => {
    const e = validateEnquiry({ name: " ", phone: "12345", message: "hi" });
    expect(Object.keys(e).sort()).toEqual(["message", "name", "phone"]);
    expect(validateEnquiry({ name: "Aman", phone: "call me", message: "long enough message" }).phone).toBeTruthy();
    expect(validateEnquiry({ name: "Aman", phone: "9876543210", message: "x".repeat(1001) }).message).toBeTruthy();
  });
});

describe("catalogue data integrity", () => {
  it("has unique slugs and variant ids", () => {
    const slugs = products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const ids = products.flatMap((p) => p.variants.map((v) => v.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(collections.map((c) => c.slug)).size).toBe(collections.length);
  });
  it("never shows a comparison price without a selling price", () => {
    for (const p of products) for (const v of p.variants) if (v.compareAtPrice != null) expect(v.price).not.toBeNull();
  });
  it("includes the seven reference bestsellers", () => {
    expect(products.filter((p) => p.bestseller)).toHaveLength(7);
  });
});

describe("whatsapp + structured data", () => {
  it("prefills product enquiries with name and selected size", () => {
    const p = products.find((x) => x.slug === "emporio-armani-stronger-with-you-intensely")!;
    const url = whatsappUrl(productEnquiryMessage(p, p.variants[1]));
    expect(url.startsWith("https://wa.me/919662041440?text=")).toBe(true);
    const text = decodeURIComponent(url.split("text=")[1]);
    expect(text).toContain("Emporio Armani Stronger With You Intensely");
    expect(text).toContain("Size: 100 ml");
  });
  it("emits no offers or ratings without confirmed prices", () => {
    const ld = productJsonLd(products[0]);
    expect(ld).not.toHaveProperty("offers");
    expect(JSON.stringify(ld)).not.toMatch(/aggregateRating|review/i);
  });
});
