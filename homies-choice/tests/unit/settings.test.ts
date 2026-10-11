import { describe, expect, it } from "vitest";
import { getPolicy } from "@/data/policies";
import { newOrderRef, ORDER_REF_PATTERN, parseOrderInput } from "@/lib/orders";
import {
  codSummary,
  codTokenActive,
  defaultSettings,
  parseSettings,
  settingsProblems,
  upiLink,
  whatsappDigits,
} from "@/lib/store-settings";
import { whatsappFor } from "@/lib/whatsapp";

describe("store settings", () => {
  it("fills in everything from defaults (older rows had only the announcement)", () => {
    const s = parseSettings({ announcement: { enabled: false, text: "Eid collection is here", href: "/shop" } });
    expect(s.announcement).toEqual({ enabled: false, text: "Eid collection is here", href: "/shop" });
    expect(s.business).toEqual(defaultSettings.business);
    expect(s.home.hero.visual).toBe("bottle");
    expect(Object.values(s.home.sections).every(Boolean)).toBe(true);
    expect(s.checkout.upi.enabled).toBe(false);
  });

  it("saves only the sections sent, keeping the rest", () => {
    const current = parseSettings({ business: { ...defaultSettings.business, owner: "Zakir" } });
    const next = parseSettings({ checkout: { ...defaultSettings.checkout, cod: { enabled: true, tokenEnabled: true, tokenAmount: 199.6, note: "" } } }, current);
    expect(next.business.owner).toBe("Zakir");
    expect(next.checkout.cod.tokenAmount).toBe(200);
    expect(codTokenActive(next.checkout)).toBe(true);
    expect(codSummary(true, 200)).toContain("₹200 advance token");
  });

  it("rejects unsafe or broken values", () => {
    const s = parseSettings({
      announcement: { enabled: true, text: "Hi", href: "javascript:alert(1)" },
      business: { mapsUrl: "http://maps.example", instagram: "instagram.com/x", email: "nope", postalCode: "12" },
      home: { hero: { primary: { label: "Go", href: "javascript:alert(1)" }, liquid: "purple", visual: "video" }, sections: { brands: false, bogus: false } },
      checkout: { upi: { enabled: true, vpa: "not a vpa", payeeName: "" }, cod: { tokenAmount: 10_000_000 } },
    });
    expect(s.announcement.href).toBeNull();
    expect(s.business.mapsUrl).toBe(defaultSettings.business.mapsUrl);
    expect(s.business.instagram).toBeNull();
    expect(s.business.email).toBeNull();
    expect(s.business.postalCode).toBeNull();
    expect(s.home.hero.primary.href).toBe("/shop");
    expect(s.home.hero.liquid).toBe("emerald");
    expect(s.home.hero.visual).toBe("bottle");
    expect(s.home.sections.brands).toBe(false);
    expect(s.home.sections).not.toHaveProperty("bogus");
    // An invalid UPI ID is dropped and UPI stays off.
    expect(s.checkout.upi).toMatchObject({ enabled: false, vpa: "", payeeName: defaultSettings.checkout.upi.payeeName });
    expect(s.checkout.cod.tokenAmount).toBe(50_000);
  });

  it("explains problems instead of silently ignoring them", () => {
    expect(settingsProblems({ checkout: { upi: { vpa: "shop@", enabled: true } } }).join(" ")).toMatch(/UPI ID/);
    expect(settingsProblems({ checkout: { upi: { vpa: "", enabled: true } } }).join(" ")).toMatch(/add your UPI ID/);
    expect(settingsProblems({ checkout: { cod: { tokenEnabled: true, tokenAmount: 0 } } }).join(" ")).toMatch(/above ₹0/);
    expect(settingsProblems({ business: { whatsapp: "12345" } }).join(" ")).toMatch(/WhatsApp number/);
    expect(settingsProblems({ business: defaultSettings.business, checkout: { upi: { vpa: "my.shop@okaxis", enabled: true } } })).toEqual([]);
  });

  it("keeps paragraph breaks in policies and uses them on the policy page", () => {
    const s = parseSettings({ policies: { returns: "  Returns within 7 days.\r\n\r\n\r\nUnopened bottles only.  " } });
    expect(s.policies.returns).toBe("Returns within 7 days.\n\nUnopened bottles only.");
    expect(getPolicy("returns", s)?.body).toEqual(["Returns within 7 days.", "Unopened bottles only."]);
    // Empty → the standard wording, filled in with the business details.
    expect(getPolicy("shipping", s)?.body.join(" ")).toContain("Paldi Congress Bhavan");
  });

  it("builds WhatsApp links from the saved number", () => {
    expect(whatsappDigits("+91 96620 41440")).toBe("919662041440");
    expect(whatsappDigits("98765 43210")).toBe("919876543210");
    const wa = whatsappFor({ business: { ...defaultSettings.business, whatsapp: "+91 98765 43210" } });
    expect(wa("Hi there")).toBe("https://wa.me/919876543210?text=Hi%20there");
  });

  it("builds UPI payment links", () => {
    const link = upiLink({ vpa: "my.shop@okaxis", payeeName: "HOMIES CHOICE", amount: 1499, note: "Order HC-7K4Q2M" });
    expect(link).toBe("upi://pay?pa=my.shop%40okaxis&pn=HOMIES%20CHOICE&am=1499.00&cu=INR&tn=Order%20HC-7K4Q2M");
    expect(upiLink({ vpa: "a.b@ybl", payeeName: "Shop" })).toBe("upi://pay?pa=a.b%40ybl&pn=Shop&cu=INR");
  });
});

describe("orders", () => {
  it("makes short, unambiguous references", () => {
    for (let i = 0; i < 50; i++) expect(newOrderRef()).toMatch(ORDER_REF_PATTERN);
  });

  it("validates what the browser sends", () => {
    const ok = parseOrderInput({ ref: "hc-7k4q2m", payment: "upi", paymentRef: "4123 4567-8901!", name: "  Riya  ", items: [{ slug: "lattafa-khamrah", variantId: "x", qty: 2 }] });
    expect(ok).toEqual({
      input: { ref: "HC-7K4Q2M", payment: "upi", paymentRef: "41234567-8901", name: "Riya", area: "", note: "", items: [{ slug: "lattafa-khamrah", variantId: "x", qty: 2 }] },
    });
    expect(parseOrderInput({ ref: "HC-0O1IL0", payment: "upi", items: [{ slug: "a", variantId: "b", qty: 1 }] })).toHaveProperty("error");
    expect(parseOrderInput({ ref: "HC-7K4Q2M", payment: "card", items: [{ slug: "a", variantId: "b", qty: 1 }] })).toHaveProperty("error");
    expect(parseOrderInput({ ref: "HC-7K4Q2M", payment: "cod", items: [{ slug: "a", variantId: "b", qty: 50 }] })).toHaveProperty("error");
    expect(parseOrderInput({ ref: "HC-7K4Q2M", payment: "cod", items: [] })).toHaveProperty("error");
  });
});
