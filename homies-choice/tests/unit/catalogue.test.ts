import { describe, expect, it } from "vitest";
import { products, type Product } from "@/data/products";
import { applyFilters, emptyFilters, inScope, matchesQuery, parseFilters, serializeFilters } from "@/lib/catalogue";

const names = (list: Product[]) => list.map((p) => p.name);

const priced: Product[] = products.slice(0, 3).map((p, i) => ({
  ...p,
  variants: p.variants.map((v) => ({ ...v, price: [3000, 1200, 8000][i] })),
}));

describe("catalogue", () => {
  it("searches by name and brand, ignoring case and punctuation", () => {
    const khamrah = products.find((p) => p.slug === "lattafa-khamrah")!;
    expect(matchesQuery(khamrah, "KHAMRAH")).toBe(true);
    expect(matchesQuery(khamrah, "lattafa kham")).toBe(true);
    expect(matchesQuery(khamrah, "armani")).toBe(false);
    expect(names(applyFilters(products, { ...emptyFilters, q: "lattafa" }))).toEqual(["Khamrah", "Asad Bourbon"]);
    expect(names(applyFilters(products, { ...emptyFilters, q: "9pm" }))).toEqual([]);
    expect(names(applyFilters(products, { ...emptyFilters, q: "9 pm" }))).toEqual(["9 PM"]);
  });

  it("filters by gender, origin, family and size", () => {
    expect(applyFilters(products, { ...emptyFilters, gender: ["unisex"] }).every((p) => p.gender === "unisex")).toBe(true);
    expect(names(applyFilters(products, { ...emptyFilters, origin: ["designer"] }))).toEqual(["Stronger With You Intensely"]);
    expect(names(applyFilters(products, { ...emptyFilters, family: ["aquatic"] }))).toEqual(["Hawas for Him"]);
    expect(names(applyFilters(products, { ...emptyFilters, size: [50] }))).toEqual(["Stronger With You Intensely"]);
  });

  it("filters by price range, excluding price-on-request items", () => {
    const withUnpriced = [...priced, products[4]];
    expect(names(applyFilters(withUnpriced, { ...emptyFilters, minPrice: 2000, maxPrice: 5000 }))).toEqual([priced[0].name]);
    expect(applyFilters(withUnpriced, { ...emptyFilters, maxPrice: 100000 })).toHaveLength(3);
  });

  it("sorts by price (unpriced last) and alphabetically", () => {
    const list = [products[4], ...priced];
    expect(names(applyFilters(list, { ...emptyFilters, sort: "price-asc" }))).toEqual([priced[1].name, priced[0].name, priced[2].name, products[4].name]);
    expect(names(applyFilters(list, { ...emptyFilters, sort: "price-desc" }))[0]).toBe(priced[2].name);
    const az = names(applyFilters(products, { ...emptyFilters, sort: "name-asc" }));
    expect(az[0]).toBe("9 PM"); // "Afnan 9 PM"
    expect(names(applyFilters(products, { ...emptyFilters, sort: "name-desc" }))).toEqual([...az].reverse());
  });

  it("round-trips filters through the URL and ignores junk", () => {
    const f = { ...emptyFilters, q: "oud", gender: ["men" as const], family: ["amber" as const, "spicy" as const], size: [100], minPrice: 500, sort: "price-asc" as const };
    expect(parseFilters(new URLSearchParams(serializeFilters(f)))).toEqual(f);
    const junk = parseFilters(new URLSearchParams("gender=robot,men&family=xyz&size=-3&min=abc&sort=hack"));
    expect(junk).toEqual({ ...emptyFilters, gender: ["men"] });
  });

  it("scopes collections", () => {
    expect(products.filter((p) => inScope(p, { origin: "arabic" })).every((p) => p.origin === "arabic")).toBe(true);
    expect(products.filter((p) => inScope(p, { mood: "fresh-aquatic" })).map((p) => p.slug)).toEqual(["rasasi-hawas-for-him"]);
  });
});
