"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Trash2, X } from "lucide-react";
import { productTitle } from "@/data/products";
import { formatPrice, variantLabel } from "@/lib/format";
import { orderMessage, whatsappUrl } from "@/lib/whatsapp";
import { ProductImage } from "@/components/product/ProductImage";
import { QtyStepper } from "@/components/product/QtyStepper";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useCart } from "./CartProvider";
import { BagTotals } from "./BagTotals";

export function CartDrawer() {
  const cart = useCart();

  return (
    <Dialog.Root open={cart.isOpen} onOpenChange={(o) => (o ? cart.open() : cart.close())}>
      <Dialog.Portal>
        <Dialog.Overlay className="anim-overlay fixed inset-0 z-50 bg-forest/50 backdrop-blur-md" />
        <Dialog.Content className="anim-drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-hidden bg-ivory shadow-2xl sm:inset-y-3 sm:right-3 sm:rounded-[2rem]">
          <div className="flex h-[4.25rem] items-center justify-between border-b border-line px-6">
            <Dialog.Title className="eyebrow text-charcoal">
              Your bag <span className="text-stone">({cart.itemCount})</span>
            </Dialog.Title>
            <Dialog.Close className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-charcoal/5 hover:text-emerald" aria-label="Close bag">
              <X className="h-5 w-5" strokeWidth={1.4} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Review the fragrances in your bag and send your order enquiry.</Dialog.Description>

          {cart.lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <ShoppingBag className="h-8 w-8 text-gold-deep" strokeWidth={1} aria-hidden="true" />
              <p className="display mt-6 text-3xl">Your bag is empty</p>
              <p className="mt-3 text-sm text-stone">Discover a fragrance that feels unmistakably yours.</p>
              <Link href="/shop" onClick={cart.close} className="btn btn-dark mt-8">
                Shop the collection
              </Link>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-line overflow-y-auto px-6" aria-label="Items in your bag">
                {cart.lines.map((line) => {
                  const title = productTitle(line.product);
                  return (
                    <li key={line.key} className="flex gap-4 py-5">
                      <Link href={`/products/${line.product.slug}`} onClick={cart.close} className="shrink-0" tabIndex={-1} aria-hidden="true">
                        <ProductImage product={line.product} variant="thumb" className="h-28 w-[5.5rem] rounded-2xl" sizes="88px" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="eyebrow text-[0.58rem] text-gold-deep">{line.product.brand}</p>
                            <Link
                              href={`/products/${line.product.slug}`}
                              onClick={cart.close}
                              className="mt-1 block font-serif text-lg leading-tight hover:text-emerald"
                            >
                              {line.product.name}
                            </Link>
                          </div>
                          <button
                            type="button"
                            onClick={() => cart.remove(line.key)}
                            className="-mt-1 -mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center text-stone hover:text-charcoal"
                            aria-label={`Remove ${title} from bag`}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.4} />
                          </button>
                        </div>
                        {line.product.variants.length > 1 ? (
                          <label className="mt-2 text-xs text-stone">
                            <span className="sr-only">{line.product.category === "watch" ? "Option" : "Bottle size"} for {title}</span>
                            <select
                              value={line.variant.id}
                              onChange={(e) => cart.updateVariant(line.key, e.target.value)}
                              className="rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs text-charcoal"
                            >
                              {line.product.variants.map((v) => (
                                <option key={v.id} value={v.id} disabled={v.availability === "out_of_stock"}>
                                  {variantLabel(v, line.product.category)}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <p className="mt-2 text-xs text-stone">{variantLabel(line.variant, line.product.category)}</p>
                        )}
                        <div className="mt-auto flex items-end justify-between pt-3">
                          <QtyStepper size="sm" value={line.qty} onChange={(n) => cart.updateQty(line.key, n)} label={`Quantity of ${title}`} />
                          <span className="text-sm tabular-nums">
                            {line.lineTotal == null ? <span className="text-stone">Price on request</span> : formatPrice(line.lineTotal)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="glass-light m-3 rounded-[1.5rem] px-5 py-5">
                <BagTotals summary={cart} />
                <Link href="/checkout" onClick={cart.close} className="btn btn-dark mt-5 w-full">
                  Review order <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={whatsappUrl(orderMessage(cart))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-dark mt-2 w-full"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Order on WhatsApp
                </a>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
