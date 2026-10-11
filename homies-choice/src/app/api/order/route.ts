import { NextResponse } from "next/server";
import { productTitle } from "@/data/products";
import { variantLabel } from "@/lib/format";
import { parseOrderInput, type OrderItem } from "@/lib/orders";
import { codTokenActive } from "@/lib/store-settings";
import { getCatalogue } from "@/lib/server/catalogue-source";
import { getSettings } from "@/lib/server/settings";
import { db, supabaseConfigured } from "@/lib/server/supabase";

/**
 * Keeps a copy of an order sent from the checkout (table `orders`) so it shows up
 * in the dashboard. The order itself always reaches the shop on WhatsApp, so this
 * never blocks the customer. Products and prices are looked up here, never trusted
 * from the browser.
 */
export async function POST(request: Request) {
  const parsed = parseOrderInput(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ ok: false, error: parsed.error }, { status: 422 });
  if (!supabaseConfigured()) return NextResponse.json({ ok: true, stored: false }, { status: 202 });
  const { input } = parsed;

  const [catalogue, settings] = await Promise.all([getCatalogue(), getSettings()]);
  const items: OrderItem[] = [];
  for (const it of input.items) {
    const product = catalogue.find((p) => p.slug === it.slug);
    const variant = product?.variants.find((v) => v.id === it.variantId);
    if (!product || !variant) return NextResponse.json({ ok: false, error: "A product in this order is no longer available." }, { status: 422 });
    items.push({ slug: product.slug, variantId: variant.id, title: productTitle(product), option: variantLabel(variant, product.category), qty: it.qty, unitPrice: variant.price });
  }
  const unpriced = items.filter((i) => i.unitPrice == null).length;
  const subtotal = items.reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.qty, 0);
  const { checkout } = settings;
  const payment =
    (input.payment === "cod" && checkout.cod.enabled) || (input.payment === "upi" && checkout.upi.enabled) ? input.payment : "whatsapp";

  const { error } = await db()
    .from("orders")
    .insert({
      ref: input.ref,
      customer_name: input.name,
      area: input.area,
      note: input.note,
      payment_method: payment,
      payment_ref: input.paymentRef,
      token_amount: payment === "cod" && codTokenActive(checkout) ? checkout.cod.tokenAmount : null,
      subtotal: unpriced === items.length ? null : subtotal,
      unpriced_items: unpriced,
      items: JSON.parse(JSON.stringify(items)),
    });
  if (error) {
    // 23505: the same order sent twice (e.g. the button pressed again) — already stored.
    if (error.code === "23505") return NextResponse.json({ ok: true, stored: true }, { status: 200 });
    console.error("Order insert failed", error.message);
    return NextResponse.json({ ok: false, stored: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true, stored: true }, { status: 201 });
}
