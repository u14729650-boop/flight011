import Image from "next/image";
import type { Product } from "@/data/products";
import { productTitle } from "@/data/products";
import { cx } from "@/lib/format";
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
          // Remote images (uploaded via the admin, or linked) are served as-is.
          unoptimized={image.src.startsWith("http")}
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
      className={cx("tone-ivory relative flex flex-col items-center justify-center overflow-hidden text-center", className)}
    >
      <div className="absolute inset-[7%] border border-gold/45" aria-hidden="true" />
      <div className="relative flex flex-col items-center px-[12%]" aria-hidden="true">
        {variant !== "thumb" && (
          <>
            <Monogram className={cx("mb-5 opacity-80", variant === "hero" ? "h-14" : "h-8 md:h-10")} />
            <span className="eyebrow mb-3 text-[0.6rem] text-gold-deep">{product.brand}</span>
          </>
        )}
        <span
          className={cx(
            "font-serif italic leading-[1.05] text-emerald",
            variant === "hero" ? "text-4xl md:text-5xl" : variant === "thumb" ? "text-sm" : "text-xl md:text-3xl",
          )}
        >
          {product.name}
        </span>
        {variant !== "thumb" && (
          <>
            <span className="my-4 block h-px w-8 bg-gold" />
            <span className="text-[0.5rem] font-medium tracking-[0.18em] text-stone uppercase md:text-[0.6rem]">Photograph coming soon</span>
          </>
        )}
      </div>
    </div>
  );
}
