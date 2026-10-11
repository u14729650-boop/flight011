// Preview stand-in for the order API: keeps the order in the browser's demo store.
import { productTitle } from "@/data/products";
import { variantLabel } from "@/lib/format";
import { parseOrderInput, type Order, type OrderInput } from "@/lib/orders";
import { codTokenActive } from "@/lib/store-settings";
import { getStore, updateStore } from "./demo-store";

export function submitOrderCopy(raw: OrderInput): void {
  const parsed = parseOrderInput(raw);
  if ("error" in parsed) return;
  const { input } = parsed;
  const { products, settings, orders } = getStore();
  if (orders.some((o) => o.ref === input.ref)) return;
  const items = input.items.flatMap((it) => {
    const p = products.find((x) => x.slug === it.slug);
    const v = p?.variants.find((x) => x.id === it.variantId);
    return p && v ? [{ slug: p.slug, variantId: v.id, title: productTitle(p), option: variantLabel(v, p.category), qty: it.qty, unitPrice: v.price }] : [];
  });
  if (!items.length) return;
  const unpriced = items.filter((i) => i.unitPrice == null).length;
  const { checkout } = settings;
  const payment = (input.payment === "cod" && checkout.cod.enabled) || (input.payment === "upi" && checkout.upi.enabled) ? input.payment : "whatsapp";
  const order: Order = {
    id: crypto.randomUUID(),
    ref: input.ref,
    status: "new",
    name: input.name,
    area: input.area,
    note: input.note,
    payment,
    paymentRef: input.paymentRef,
    tokenAmount: payment === "cod" && codTokenActive(checkout) ? checkout.cod.tokenAmount : null,
    subtotal: unpriced === items.length ? null : items.reduce((n, i) => n + (i.unitPrice ?? 0) * i.qty, 0),
    unpricedItems: unpriced,
    items,
    createdAt: new Date().toISOString(),
  };
  // Defer so the WhatsApp link opens before the preview re-renders.
  setTimeout(() => updateStore((s) => ({ ...s, orders: [order, ...s.orders] })), 0);
}
