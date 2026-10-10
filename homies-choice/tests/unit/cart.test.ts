import { describe, expect, it, vi } from "vitest";

// Use a fixture catalogue with confirmed prices so the maths can be checked.
vi.mock("@/data/products", async (orig) => {
  const real = await orig<typeof import("@/data/products")>();
  const products: import("@/data/products").Product[] = [
    {
      slug: "a", brand: "Brand", name: "Alpha", concentration: "Eau de Parfum", gender: "men", origin: "arabic",
      families: [], moods: [], description: "", notes: null, images: [], bestseller: false,
      variants: [
        { id: "a-50", sizeMl: 50, price: 1500, compareAtPrice: null, availability: "in_stock" },
        { id: "a-100", sizeMl: 100, price: 2499, compareAtPrice: null, availability: "in_stock" },
      ],
    },
    {
      slug: "b", brand: "Other", name: "Beta", concentration: null, gender: "women", origin: "designer",
      families: [], moods: [], description: "", notes: null, images: [], bestseller: false,
      variants: [{ id: "b-1", sizeMl: null, price: null, compareAtPrice: null, availability: "on_request" }],
    },
  ];
  return {
    ...real,
    products,
    getProduct: (slug: string) => products.find((p) => p.slug === slug),
  };
});

const { addItem, changeVariant, clampQty, lineKey, removeItem, sanitize, setQty, summarize, MAX_QTY } = await import("@/lib/cart");
const { orderMessage } = await import("@/lib/whatsapp");

describe("cart", () => {
  it("adds, merges and caps quantities", () => {
    let items = addItem([], "a", "a-50", 2);
    items = addItem(items, "a", "a-50", 3);
    expect(items).toEqual([{ slug: "a", variantId: "a-50", qty: 5 }]);
    items = addItem(items, "a", "a-50", 50);
    expect(items[0].qty).toBe(MAX_QTY);
    expect(clampQty(0)).toBe(1);
    expect(clampQty(NaN)).toBe(1);
  });

  it("updates and removes lines", () => {
    let items = addItem(addItem([], "a", "a-50"), "b", "b-1");
    items = setQty(items, lineKey("a", "a-50"), 3);
    expect(items[0].qty).toBe(3);
    items = setQty(items, lineKey("a", "a-50"), 0);
    expect(items).toHaveLength(1);
    items = removeItem(items, lineKey("b", "b-1"));
    expect(items).toEqual([]);
  });

  it("changes bottle size and merges with an existing line of that size", () => {
    let items = addItem(addItem([], "a", "a-50", 2), "a", "a-100", 1);
    items = changeVariant(items, lineKey("a", "a-50"), "a-100");
    expect(items).toEqual([{ slug: "a", variantId: "a-100", qty: 3 }]);
  });

  it("calculates subtotals and keeps unpriced items separate", () => {
    const items = [
      { slug: "a", variantId: "a-50", qty: 2 },
      { slug: "a", variantId: "a-100", qty: 1 },
      { slug: "b", variantId: "b-1", qty: 4 },
    ];
    const s = summarize(items);
    expect(s.subtotal).toBe(1500 * 2 + 2499);
    expect(s.itemCount).toBe(7);
    expect(s.unpricedLines).toBe(1);
    expect(s.lines.map((l) => l.lineTotal)).toEqual([3000, 2499, null]);
  });

  it("sanitizes stored data", () => {
    expect(sanitize("nope")).toEqual([]);
    expect(
      sanitize([
        { slug: "a", variantId: "a-50", qty: 2 },
        { slug: "a", variantId: "a-50", qty: 1 },
        { slug: "ghost", variantId: "x", qty: 1 },
        { slug: "a", variantId: "missing", qty: 1 },
        { slug: "a" },
      ]),
    ).toEqual([{ slug: "a", variantId: "a-50", qty: 3 }]);
  });

  it("builds a WhatsApp order message with sizes, quantities and subtotal", () => {
    const s = summarize([
      { slug: "a", variantId: "a-100", qty: 2 },
      { slug: "b", variantId: "b-1", qty: 1 },
    ]);
    const msg = orderMessage(s, { name: "  Riya  ", area: "Paldi" });
    expect(msg).toContain("Name: Riya");
    expect(msg).toContain("Delivery area: Paldi");
    expect(msg).toContain("1. Brand Alpha — 100 ml × 2 — ₹4,998");
    expect(msg).toContain("2. Other Beta — Size to be confirmed × 1 — price to be confirmed");
    expect(msg).toContain("Product subtotal: ₹4,998 (plus 1 item awaiting price)");
    expect(msg).toContain("Please confirm stock availability, delivery charges and the final payable amount.");
    expect(msg).not.toMatch(/confirmed order|order is confirmed/i);
  });

  it("omits name lines when no name is entered", () => {
    const msg = orderMessage(summarize([{ slug: "a", variantId: "a-50", qty: 1 }]));
    expect(msg).not.toContain("Name:");
    expect(msg).toContain("Product subtotal: ₹1,500");
  });
});
