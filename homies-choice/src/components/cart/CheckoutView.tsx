"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Banknote, Info, ShoppingBag, Smartphone, Trash2 } from "lucide-react";
import { productTitle } from "@/data/products";
import { cx, formatPrice, variantLabel } from "@/lib/format";
import { newOrderRef, paymentLabels, type PaymentMethod } from "@/lib/orders";
import { submitOrderCopy } from "@/lib/order-client";
import { codSummary, codTokenActive } from "@/lib/store-settings";
import { orderMessage } from "@/lib/whatsapp";
import { ProductImage } from "@/components/product/ProductImage";
import { QtyStepper } from "@/components/product/QtyStepper";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useStore, useWhatsapp } from "@/components/store/StoreProvider";
import { useCart } from "./CartProvider";
import { BagTotals } from "./BagTotals";
import { UpiPay } from "./UpiPay";

export function CheckoutView() {
  const cart = useCart();
  const wa = useWhatsapp();
  const { checkout } = useStore();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [note, setNote] = useState("");
  const [opened, setOpened] = useState(false);
  const [ref, setRef] = useState(newOrderRef);
  const [paymentRef, setPaymentRef] = useState("");
  const options: PaymentMethod[] = [...(checkout.cod.enabled ? ["cod" as const] : []), ...(checkout.upi.enabled ? ["upi" as const] : [])];
  const [chosen, setChosen] = useState<PaymentMethod | null>(null);
  const method: PaymentMethod = chosen && options.includes(chosen) ? chosen : (options[0] ?? "whatsapp");

  // A changed bag after sending is a new order: give it its own reference.
  const sent = useRef(false);
  const signature = cart.lines.map((l) => `${l.key}:${l.qty}`).join("|");
  useEffect(() => {
    if (!sent.current) return;
    sent.current = false;
    setOpened(false);
    setRef(newOrderRef());
  }, [signature]);

  if (!cart.hydrated) {
    return <div className="container-luxe min-h-[50vh] py-20" aria-busy="true" />;
  }

  if (cart.lines.length === 0) {
    return (
      <div className="container-luxe flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
        <ShoppingBag className="h-8 w-8 text-gold-deep" strokeWidth={1} aria-hidden="true" />
        <h1 className="display mt-6 text-5xl">Your bag is empty</h1>
        <p className="mt-4 text-stone">Add a fragrance to your bag to send an order enquiry.</p>
        <Link href="/shop" className="btn btn-dark mt-8">Shop the collection</Link>
      </div>
    );
  }

  const tokenActive = codTokenActive(checkout);
  const token = checkout.cod.tokenAmount;
  const vpa = checkout.upi.vpa;
  const allPriced = cart.unpricedLines === 0;
  const upiAmount = allPriced ? cart.subtotal : null;

  const payment: string[] = [];
  if (method === "cod") {
    payment.push(tokenActive ? `Payment: Cash on delivery, with a ${formatPrice(token)} advance token.` : "Payment: Cash on delivery.");
    if (tokenActive) payment.push(paymentRef ? `Token paid by UPI — transaction ID ${paymentRef}.` : "Token: not paid yet.");
  } else if (method === "upi") {
    payment.push(`Payment: UPI${upiAmount != null ? ` — ${formatPrice(upiAmount)}` : " (after you confirm the total)"}.`);
    payment.push(paymentRef ? `UPI transaction ID ${paymentRef}.` : "UPI payment: not made yet.");
  }
  const message = orderMessage(cart, { name, area, note, ref, payment });

  const sendOrder = () => {
    submitOrderCopy({
      ref,
      name,
      area,
      note,
      payment: method,
      paymentRef: method === "upi" || (method === "cod" && tokenActive) ? paymentRef : "",
      items: cart.lines.map((l) => ({ slug: l.product.slug, variantId: l.variant.id, qty: l.qty })),
    });
    sent.current = true;
    setOpened(true);
  };

  const optionCopy: Record<"cod" | "upi", { title: string; body: string; icon: typeof Banknote }> = {
    cod: {
      title: paymentLabels.cod,
      body: [codSummary(tokenActive, token), checkout.cod.note].filter(Boolean).join(" "),
      icon: Banknote,
    },
    upi: {
      title: "UPI",
      body: ["Google Pay, PhonePe, Paytm or any UPI app.", checkout.upi.note].filter(Boolean).join(" "),
      icon: Smartphone,
    },
  };

  return (
    <div className="relative isolate container-luxe overflow-x-clip py-12 md:py-16">
      <div className="orb orb-gold h-96 w-96 top-20 right-0 opacity-40" aria-hidden="true" />
      <p className="eyebrow text-gold-deep">Order enquiry</p>
      <h1 className="display mt-4 text-5xl md:text-6xl">Review your order</h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <section aria-labelledby="bag-title">
          <h2 id="bag-title" className="eyebrow border-b border-line pb-4 text-charcoal">
            Your bag ({cart.itemCount})
          </h2>
          <ul className="divide-y divide-line">
            {cart.lines.map((line) => {
              const title = productTitle(line.product);
              return (
                <li key={line.key} className="flex gap-5 py-6">
                  <ProductImage product={line.product} variant="thumb" className="h-32 w-24 shrink-0 rounded-2xl" sizes="96px" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="eyebrow text-[0.58rem] text-gold-deep">{line.product.brand}</p>
                        <Link href={`/products/${line.product.slug}`} className="mt-1 block font-serif text-2xl leading-tight hover:text-emerald">
                          {line.product.name}
                        </Link>
                      </div>
                      <button type="button" onClick={() => cart.remove(line.key)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone transition-colors hover:bg-charcoal/5 hover:text-charcoal" aria-label={`Remove ${title}`}>
                        <Trash2 className="h-4 w-4" strokeWidth={1.4} />
                      </button>
                    </div>
                    {line.product.variants.length > 1 ? (
                      <label className="mt-2 text-sm text-stone">
                        <span className="sr-only">{line.product.category === "watch" ? "Option" : "Bottle size"} for {title}</span>
                        <select value={line.variant.id} onChange={(e) => cart.updateVariant(line.key, e.target.value)} className="rounded-full border border-line bg-white/70 px-3 py-1.5 text-sm text-charcoal">
                          {line.product.variants.map((v) => (
                            <option key={v.id} value={v.id} disabled={v.availability === "out_of_stock"}>{variantLabel(v, line.product.category)}</option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <p className="mt-2 text-sm text-stone">{variantLabel(line.variant, line.product.category)}</p>
                    )}
                    <div className="mt-auto flex items-end justify-between pt-4">
                      <QtyStepper size="sm" value={line.qty} onChange={(n) => cart.updateQty(line.key, n)} label={`Quantity of ${title}`} />
                      <span className="tabular-nums">
                        {line.lineTotal == null ? <span className="text-sm text-stone">Price on request</span> : formatPrice(line.lineTotal)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={cart.clear} className="mt-2 text-xs font-semibold tracking-[0.12em] text-stone uppercase hover:text-charcoal">
            Empty bag
          </button>
        </section>

        <section aria-labelledby="details-title" className="lg:sticky lg:top-[11rem] lg:self-start">
          <div className="glass-light rounded-[2rem] p-6 md:p-8">
            <h2 id="details-title" className="eyebrow text-charcoal">Your details <span className="font-normal normal-case tracking-normal text-stone">(optional)</span></h2>
            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="order-name" className="eyebrow text-[0.6rem] text-stone">Name</label>
                <input id="order-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="field" />
              </div>
              <div>
                <label htmlFor="order-area" className="eyebrow text-[0.6rem] text-stone">Delivery area / city</label>
                <input id="order-area" autoComplete="address-level2" value={area} onChange={(e) => setArea(e.target.value)} maxLength={120} className="field" placeholder="e.g. Paldi, Ahmedabad" />
              </div>
              <div>
                <label htmlFor="order-note" className="eyebrow text-[0.6rem] text-stone">Note for our team</label>
                <textarea id="order-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="field resize-none" />
              </div>
            </div>

            {options.length > 0 && (
              <fieldset className="mt-8 border-t border-line pt-6">
                <legend className="eyebrow float-left w-full text-charcoal">Payment</legend>
                <div className="clear-both grid gap-3 pt-4">
                  {options.map((o) => {
                    const { title, body, icon: Icon } = optionCopy[o as "cod" | "upi"];
                    const selected = method === o;
                    return (
                      <label
                        key={o}
                        className={cx(
                          "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                          selected ? "border-emerald bg-emerald/[0.05] ring-1 ring-emerald" : "border-line bg-white/60 hover:border-charcoal/40",
                        )}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={o}
                          checked={selected}
                          onChange={() => setChosen(o)}
                          aria-labelledby={`pay-${o}`}
                          aria-describedby={body ? `pay-${o}-info` : undefined}
                          className="mt-1 h-4 w-4 shrink-0 accent-emerald"
                        />
                        <span className="min-w-0 flex-1">
                          <span id={`pay-${o}`} className="block text-sm font-medium">{title}</span>
                          {body && <span id={`pay-${o}-info`} className="mt-0.5 block text-xs leading-relaxed text-stone">{body}</span>}
                        </span>
                        <Icon className={cx("mt-0.5 h-5 w-5 shrink-0", selected ? "text-emerald" : "text-stone")} strokeWidth={1.4} aria-hidden="true" />
                      </label>
                    );
                  })}
                </div>

                {method === "upi" && (
                  <div className="mt-4">
                    <UpiPay
                      vpa={vpa}
                      payeeName={checkout.upi.payeeName}
                      amount={upiAmount}
                      note={`Order ${ref}`}
                      heading={upiAmount != null ? "Pay now by UPI" : "Pay by UPI once we confirm the total"}
                      reference={paymentRef}
                      onReferenceChange={setPaymentRef}
                    />
                    {upiAmount == null && (
                      <p className="mt-3 text-xs leading-relaxed text-stone">
                        Some items are priced on request, so our team confirms the total on WhatsApp first — then pay the confirmed amount here or with the UPI ID above.
                      </p>
                    )}
                  </div>
                )}
                {method === "cod" && tokenActive && (
                  <div className="mt-4">
                    {vpa ? (
                      <UpiPay
                        vpa={vpa}
                        payeeName={checkout.upi.payeeName}
                        amount={token}
                        note={`Token ${ref}`}
                        heading="Advance token to confirm your order"
                        reference={paymentRef}
                        onReferenceChange={setPaymentRef}
                      />
                    ) : (
                      <p className="rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm leading-relaxed">
                        A {formatPrice(token)} advance token confirms a cash-on-delivery order. Our team will share how to pay it on WhatsApp.
                      </p>
                    )}
                  </div>
                )}
              </fieldset>
            )}

            <div className="mt-8 border-t border-line pt-6">
              <BagTotals summary={cart} />
              {method === "cod" && (
                <dl className="mt-4 space-y-1.5 rounded-2xl bg-ivory/70 p-4 text-sm" data-testid="due-summary">
                  {tokenActive && (
                    <div className="flex justify-between gap-4">
                      <dt>Advance token (now, by UPI)</dt>
                      <dd className="font-medium tabular-nums">{formatPrice(token)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt>{tokenActive ? "Balance" : "To pay"}</dt>
                    <dd className="text-right text-stone">in cash on delivery</dd>
                  </div>
                </dl>
              )}
            </div>

            <p className="mt-6 text-xs text-stone">
              Order reference <span className="font-medium text-charcoal tabular-nums" data-testid="order-ref">{ref}</span>
            </p>
            <a
              href={wa(message)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={sendOrder}
              className="btn btn-dark mt-3 w-full"
            >
              <WhatsAppIcon className="h-4 w-4" /> Place order on WhatsApp
            </a>

            <p className="mt-4 flex gap-2 text-xs leading-relaxed text-stone">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Your order is confirmed only after our team replies on WhatsApp with stock availability, delivery charges and the final payable amount.
            </p>

            {opened && (
              <div role="status" className="mt-5 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm leading-relaxed">
                Your order message is ready in WhatsApp — press <strong>send</strong> there to reach us. We&rsquo;ll reply to confirm
                availability and the final amount. Your bag is kept until you empty it.
              </div>
            )}

            <details className="mt-5 text-xs text-stone">
              <summary className="cursor-pointer select-none hover:text-charcoal">Preview the message</summary>
              <pre className="mt-3 font-sans whitespace-pre-wrap text-charcoal/80" data-testid="order-preview">{message}</pre>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
}
