/**
 * Orders placed from the checkout. The customer still sends the order on
 * WhatsApp; a copy is kept so the dashboard can track it (and the UPI
 * reference the customer typed in, if they paid online).
 */

export type PaymentMethod = "cod" | "upi" | "whatsapp";
export type OrderStatus = "new" | "confirmed" | "paid" | "shipped" | "delivered" | "cancelled";

export const paymentLabels: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  upi: "UPI",
  whatsapp: "Arrange on WhatsApp",
};

export const orderStatuses: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];
export const isOrderStatus = (v: unknown): v is OrderStatus => orderStatuses.some((s) => s.value === v);

export interface OrderItem {
  slug: string;
  variantId: string;
  title: string;
  option: string;
  qty: number;
  /** Per unit, in rupees; null when the price is on request. */
  unitPrice: number | null;
}

export interface Order {
  id: string;
  ref: string;
  status: OrderStatus;
  name: string;
  area: string;
  note: string;
  payment: PaymentMethod;
  /** UPI transaction / UTR number the customer entered, if any. */
  paymentRef: string;
  /** Advance token due on a cash-on-delivery order, in rupees. */
  tokenAmount: number | null;
  subtotal: number | null;
  unpricedItems: number;
  items: OrderItem[];
  createdAt: string;
}

/** What the browser sends; prices are looked up again on the server. */
export interface OrderInput {
  ref: string;
  name: string;
  area: string;
  note: string;
  payment: PaymentMethod;
  paymentRef: string;
  items: { slug: string; variantId: string; qty: number }[];
}

const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O, 1/I/L
export const ORDER_REF_PATTERN = /^HC-[2-9A-HJKMNP-Z]{6}$/;

/** A short reference the customer and the shop can both quote, e.g. HC-7K4Q2M. */
export function newOrderRef(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `HC-${[...bytes].map((b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("")}`;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export function parseOrderInput(raw: unknown): { input: OrderInput } | { error: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const ref = str(r.ref, 12).toUpperCase();
  if (!ORDER_REF_PATTERN.test(ref)) return { error: "Invalid order reference." };
  const payment = r.payment;
  if (payment !== "cod" && payment !== "upi" && payment !== "whatsapp") return { error: "Invalid payment method." };
  if (!Array.isArray(r.items) || r.items.length === 0 || r.items.length > 30) return { error: "Invalid items." };
  const items: OrderInput["items"] = [];
  for (const it of r.items) {
    const i = (it ?? {}) as Record<string, unknown>;
    const slug = str(i.slug, 120);
    const variantId = str(i.variantId, 120);
    const qty = Number(i.qty);
    if (!slug || !variantId || !Number.isInteger(qty) || qty < 1 || qty > 20) return { error: "Invalid items." };
    items.push({ slug, variantId, qty });
  }
  // A UPI reference is up to 35 letters/digits (UTRs are 12 digits).
  const paymentRef = str(r.paymentRef, 40).replace(/[^A-Za-z0-9-]/g, "");
  return {
    input: { ref, payment, items, paymentRef, name: str(r.name, 80), area: str(r.area, 120), note: str(r.note, 500) },
  };
}
