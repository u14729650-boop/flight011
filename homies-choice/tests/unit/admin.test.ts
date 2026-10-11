import { afterEach, describe, expect, it } from "vitest";
import { parseProductInput, slugify } from "@/lib/product-schema";
import { checkCredentials, checkPassword, createSessionToken, verifySessionToken } from "@/lib/server/admin-auth";

describe("product validation (admin)", () => {
  const base = {
    category: "watch",
    brand: "Maker",
    name: "Classic 40",
    gender: "men",
    description: "A clean everyday watch.",
    variants: [{ label: "Black dial", price: "8999", availability: "in_stock" }],
    specs: [{ label: "Case size", value: "40 mm" }, { label: "", value: "ignored" }],
  };

  it("accepts a watch and normalises it", () => {
    const { product, errors } = parseProductInput(base);
    expect(errors).toEqual({});
    expect(product.slug).toBe("maker-classic-40");
    expect(product.origin).toBeNull();
    expect(product.families).toEqual([]);
    expect(product.variants[0]).toMatchObject({ label: "Black dial", price: 8999, sizeMl: null, availability: "in_stock" });
    expect(product.specs).toEqual([{ label: "Case size", value: "40 mm" }]);
  });

  it("requires essentials and valid prices", () => {
    const { errors } = parseProductInput({
      category: "fragrance",
      variants: [{ sizeMl: "-5", price: "abc", compareAtPrice: "10" }],
    });
    expect(Object.keys(errors).sort()).toEqual(
      ["brand", "description", "name", "origin", "slug", "variants.0.price", "variants.0.sizeMl"].sort(),
    );
  });

  it("rejects a comparison price that isn't higher than the selling price", () => {
    const { errors } = parseProductInput({ ...base, variants: [{ label: "x", price: 5000, compareAtPrice: 4000 }] });
    expect(errors["variants.0.compareAtPrice"]).toBeTruthy();
  });

  it("requires a source for fragrance notes and drops unsafe image links", () => {
    const { product, errors } = parseProductInput({
      ...base,
      category: "fragrance",
      origin: "arabic",
      notes: { top: ["Bergamot"], heart: [], base: [], source: "" },
      images: [{ src: "javascript:alert(1)" }, { src: "https://cdn.example.com/a.jpg" }],
    });
    expect(errors.notesSource).toBeTruthy();
    expect(product.images.map((i) => i.src)).toEqual(["https://cdn.example.com/a.jpg"]);
  });

  it("slugifies", () => {
    expect(slugify("  Émporio Armani: Stronger With You!! ")).toBe("emporio-armani-stronger-with-you");
  });
});

describe("admin sessions", () => {
  const prev = { ...process.env };
  afterEach(() => {
    process.env = { ...prev };
  });

  it("signs, verifies and rejects tampered or foreign tokens", async () => {
    process.env.ADMIN_PASSWORD = "correct-horse-battery";
    process.env.ADMIN_SESSION_SECRET = "s3cret-for-tests";
    const { token } = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
    expect(await verifySessionToken(token.slice(0, -2) + "xx")).toBe(false);
    expect(await verifySessionToken("garbage")).toBe(false);
    process.env.ADMIN_SESSION_SECRET = "a-different-secret";
    expect(await verifySessionToken(token)).toBe(false);
  });

  it("requires both username and password", async () => {
    process.env.ADMIN_USERNAME = "owner@example";
    process.env.ADMIN_PASSWORD = "Sample-Pass_1234";
    expect(await checkCredentials("owner@example", "Sample-Pass_1234")).toBe(true);
    expect(await checkCredentials("  OWNER@example ", "Sample-Pass_1234")).toBe(true);
    expect(await checkCredentials("owner@example", "owner@example_2026")).toBe(false);
    expect(await checkCredentials("someone", "Sample-Pass_1234")).toBe(false);
    expect(await checkCredentials(undefined, "Sample-Pass_1234")).toBe(false);
  });

  it("checks the password and refuses when admin is not configured", async () => {
    process.env.ADMIN_PASSWORD = "correct-horse-battery";
    expect(await checkPassword("correct-horse-battery")).toBe(true);
    expect(await checkPassword("wrong")).toBe(false);
    delete process.env.ADMIN_PASSWORD;
    expect(await checkPassword("anything")).toBe(false);
    const { token } = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(false);
  });
});
