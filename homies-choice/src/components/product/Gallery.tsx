"use client";

import { useState } from "react";
import type { Product } from "@/data/products";
import { cx } from "@/lib/format";
import { ProductImage } from "./ProductImage";

export function Gallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const count = Math.max(product.images.length, 1);
  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {count > 1 && (
        <div className="flex gap-3 md:flex-col" role="tablist" aria-label="Product images">
          {product.images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cx("relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl border-2", i === active ? "border-emerald" : "border-transparent opacity-70 hover:opacity-100")}
            >
              <ProductImage product={product} index={i} variant="thumb" className="absolute inset-0" sizes="80px" />
            </button>
          ))}
        </div>
      )}
      <ProductImage
        product={product}
        index={active}
        variant="hero"
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="aspect-[4/5] w-full flex-1 rounded-[2rem]"
      />
    </div>
  );
}
