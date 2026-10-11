"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye } from "lucide-react";
import { productTitle, type Product } from "@/data/products";
import { categoryLine, defaultVariant, sizesLine } from "@/lib/product-meta";
import { canPurchase } from "@/lib/format";
import { useCart } from "@/components/cart/CartProvider";
import { ProductImage } from "./ProductImage";
import { PriceTag } from "./PriceTag";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { QuickView } from "./QuickView";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const cart = useCart();
  const [quickOpen, setQuickOpen] = useState(false);
  const variant = defaultVariant(product);
  const multiple = product.variants.length > 1;
  const purchasable = canPurchase(variant);
  const href = `/products/${product.slug}`;
  const title = productTitle(product);

  return (
    <article className="group flex w-full flex-col" aria-label={title}>
      <div className="relative">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <ProductImage product={product} priority={priority} className="aspect-[4/5] w-full rounded-[1.5rem] transition-transform duration-700 ease-luxe group-hover:-translate-y-1.5 group-hover:shadow-[0_30px_50px_-30px_rgba(6,59,46,0.45)]" />
        </Link>
        <button
          type="button"
          onClick={() => setQuickOpen(true)}
          className="glass-light absolute right-3 bottom-3 left-3 hidden h-11 translate-y-2 items-center justify-center gap-2 rounded-full text-[0.65rem] font-medium tracking-[0.14em] text-charcoal uppercase opacity-0 transition-all duration-500 ease-luxe group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 md:flex"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={1.6} /> Quick view
          <span className="sr-only">: {title}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-5">
        <p className="eyebrow text-[0.6rem] text-gold-deep">{product.brand}</p>
        <h3 className="mt-1.5 font-serif text-[1.2rem] leading-tight text-charcoal md:text-[1.4rem]">
          <Link href={href} className="hover:text-emerald focus-visible:text-emerald">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-stone">{categoryLine(product)}</p>
        <p className="mt-0.5 text-xs text-stone">{sizesLine(product)}</p>
        <div className="mt-3 flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3">
          <PriceTag variant={variant} from={multiple && variant.price != null} className="text-sm" />
          <AvailabilityBadge availability={variant.availability} />
        </div>
        <div className="mt-auto flex gap-2 pt-4">
          {multiple ? (
            <button type="button" onClick={() => setQuickOpen(true)} className="btn btn-outline-dark h-11 min-h-0 flex-1 px-2 text-[0.65rem] md:px-3 md:text-xs">
              Choose size
            </button>
          ) : (
            <button
              type="button"
              disabled={!purchasable}
              onClick={() => cart.add(product.slug, variant.id)}
              className="btn btn-outline-dark h-11 min-h-0 flex-1 px-2 text-[0.65rem] md:px-3 md:text-xs"
            >
              {purchasable ? "Add to bag" : "Out of stock"}
              <span className="sr-only">: {title}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setQuickOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-white/60 hover:border-charcoal md:hidden"
            aria-label={`Quick view: ${title}`}
          >
            <Eye className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <QuickView product={product} open={quickOpen} onOpenChange={setQuickOpen} />
    </article>
  );
}
