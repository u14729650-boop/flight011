"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { productTitle, type Product } from "@/data/products";
import { canPurchase } from "@/lib/format";
import { categoryLine, defaultVariant } from "@/lib/product-meta";
import { productEnquiryMessage, whatsappUrl } from "@/lib/whatsapp";
import { useCart } from "@/components/cart/CartProvider";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ProductImage } from "./ProductImage";
import { PriceTag } from "./PriceTag";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { SizeSelector } from "./SizeSelector";
import { QtyStepper } from "./QtyStepper";

export function QuickView({ product, open, onOpenChange }: { product: Product; open: boolean; onOpenChange: (o: boolean) => void }) {
  const cart = useCart();
  const [variantId, setVariantId] = useState(defaultVariant(product).id);
  const [qty, setQty] = useState(1);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="anim-overlay fixed inset-0 z-50 bg-forest/60" />
        <Dialog.Content className="anim-dialog fixed top-1/2 left-1/2 z-50 grid max-h-[92vh] w-[min(56rem,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-ivory shadow-2xl md:grid-cols-2">
          <ProductImage product={product} variant="hero" className="aspect-square w-full md:aspect-auto md:h-full md:min-h-[30rem]" sizes="(min-width: 768px) 28rem, 94vw" />
          <div className="flex flex-col p-6 md:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-[0.6rem] text-gold-deep">{product.brand}</p>
                <Dialog.Title className="display mt-2 text-4xl text-charcoal">{product.name}</Dialog.Title>
                <p className="mt-2 text-xs text-stone">{categoryLine(product)}</p>
              </div>
              <Dialog.Close className="-mt-2 -mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center hover:text-emerald" aria-label="Close quick view">
                <X className="h-5 w-5" strokeWidth={1.4} />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-5 text-sm leading-relaxed text-stone">{product.description}</Dialog.Description>

            <div className="mt-6 flex items-center justify-between">
              <PriceTag variant={variant} className="text-lg" />
              <AvailabilityBadge availability={variant.availability} />
            </div>

            <div className="mt-6">
              <SizeSelector category={product.category} variants={product.variants} value={variant.id} onChange={setVariantId} name={`qv-size-${product.slug}`} />
            </div>

            <div className="mt-6 flex gap-3">
              <QtyStepper value={qty} onChange={setQty} label="Quantity" />
              <button
                type="button"
                disabled={!canPurchase(variant)}
                onClick={() => {
                  cart.add(product.slug, variant.id, qty);
                  onOpenChange(false);
                  setQty(1);
                }}
                className="btn btn-dark flex-1"
              >
                {canPurchase(variant) ? "Add to bag" : "Out of stock"}
              </button>
            </div>
            <a
              href={whatsappUrl(productEnquiryMessage(product, variant))}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-11 items-center justify-center gap-2 text-xs font-semibold tracking-[0.12em] text-emerald uppercase hover:text-gold-deep"
            >
              <WhatsAppIcon className="h-4 w-4" /> Ask about this perfume
            </a>
            <Link
              href={`/products/${product.slug}`}
              onClick={() => onOpenChange(false)}
              className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium underline-offset-4 hover:underline"
            >
              View full details <ArrowRight className="h-4 w-4" />
              <span className="sr-only">for {productTitle(product)}</span>
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
