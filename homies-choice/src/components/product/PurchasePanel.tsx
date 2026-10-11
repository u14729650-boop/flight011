"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/data/products";
import { canPurchase } from "@/lib/format";
import { defaultVariant } from "@/lib/product-meta";
import { productEnquiryMessage, whatsappUrl } from "@/lib/whatsapp";
import { useCart } from "@/components/cart/CartProvider";
import { WhatsAppIcon } from "@/components/ui/icons";
import { PriceTag } from "./PriceTag";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { SizeSelector } from "./SizeSelector";
import { QtyStepper } from "./QtyStepper";

export function PurchasePanel({ product }: { product: Product }) {
  const cart = useCart();
  const router = useRouter();
  const [variantId, setVariantId] = useState(defaultVariant(product).id);
  const [qty, setQty] = useState(1);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const purchasable = canPurchase(variant);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-5">
        <PriceTag variant={variant} className="text-2xl" />
        <AvailabilityBadge availability={variant.availability} />
      </div>

      <div className="mt-7">
        <SizeSelector category={product.category} variants={product.variants} value={variant.id} onChange={setVariantId} name="size" />
      </div>

      <div className="mt-7">
        <p className="eyebrow mb-3 text-[0.625rem] text-stone" id="qty-label">Quantity</p>
        <QtyStepper value={qty} onChange={setQty} label="Quantity" />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={!purchasable} onClick={() => cart.add(product.slug, variant.id, qty)} className="btn btn-outline-dark">
          {purchasable ? "Add to bag" : "Out of stock"}
        </button>
        <button
          type="button"
          disabled={!purchasable}
          onClick={() => {
            cart.add(product.slug, variant.id, qty, { openDrawer: false });
            router.push("/checkout");
          }}
          className="btn btn-dark"
        >
          Buy now
        </button>
      </div>
      <a
        href={whatsappUrl(productEnquiryMessage(product, variant))}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-gold mt-3 w-full"
      >
        <WhatsAppIcon className="h-4 w-4" /> Ask about this perfume on WhatsApp
      </a>
      {variant.price == null && (
        <p className="mt-4 text-xs leading-relaxed text-stone">
          Prices for this fragrance are shared on request. Add it to your bag and our team will confirm the price, stock and delivery on WhatsApp.
        </p>
      )}
    </div>
  );
}
