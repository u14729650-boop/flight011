import Image from "next/image";
import type { Product } from "@/data/products";
import { productTitle } from "@/data/products";
import { cx } from "@/lib/format";
import { isExternalImage } from "@/lib/images";
import { Monogram } from "@/components/ui/Logo";

/**
 * Product photograph, or — until an authentic photo is supplied — a clearly
 * labelled typographic placeholder. Never substitutes another bottle.
 */
export function ProductImage({
  product,
  index = 0,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  className,
  variant = "card",
}: {
  product: Product;
  index?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  variant?: "card" | "hero" | "thumb";
}) {
  const image = product.images[index];
  if (image) {
    return (
      <div className={cx("relative overflow-hidden bg-[#efe8da]", className)}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          // Supabase Storage photos are optimised by next/image; other links are served as-is.
          unoptimized={isExternalImage(image.src)}
          className="object-contain p-[8%] transition-transform duration-[1.2s] ease-luxe group-hover:scale-[1.04]"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${productTitle(product)} — product photograph coming soon`}
      data-placeholder="product"
      className={cx("tone-ivory @container relative flex flex-col items-center justify-center overflow-hidden text-center", className)}
    >
      <div className="absolute inset-[6%] rounded-[1.1rem] border border-gold/40" aria-hidden="true" />
      {/* Sized by the card's own width (container query), so narrow phone grids never clip it. */}
      <div className="relative flex max-h-[88%] flex-col items-center px-[13%]" aria-hidden="true">
        {variant !== "thumb" && (
          <>
            <Monogram className={cx("opacity-80", variant === "hero" ? "mb-5 h-14" : "mb-3 h-6 @[15rem]:mb-5 @[15rem]:h-10")} />
            <span className="eyebrow mb-2 text-[0.5rem] tracking-[0.2em] text-gold-deep @[15rem]:mb-3 @[15rem]:text-[0.6rem]">{product.brand}</span>
          </>
        )}
        {variant === "thumb" ? (
          <Monogram className="h-5 opacity-70" />
        ) : (
          <span className={cx("font-serif italic leading-[1.05] text-emerald", variant === "hero" ? "text-4xl md:text-5xl" : "line-clamp-3 text-lg @[15rem]:text-3xl")}>
            {product.name}
          </span>
        )}
        {variant !== "thumb" && (
          <>
            <span className="my-2.5 block h-px w-6 bg-gold @[15rem]:my-4 @[15rem]:w-8" />
            <span className="text-[0.48rem] font-medium tracking-[0.14em] text-stone uppercase @[15rem]:text-[0.6rem] @[15rem]:tracking-[0.18em]">
              <span className="@[15rem]:hidden">Photo coming soon</span>
              <span className="hidden @[15rem]:inline">Photograph coming soon</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
