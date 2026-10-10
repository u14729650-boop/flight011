import type { ProductVariant } from "@/data/products";
import { cx, formatPrice } from "@/lib/format";

export function PriceTag({ variant, from = false, className }: { variant: Pick<ProductVariant, "price" | "compareAtPrice">; from?: boolean; className?: string }) {
  if (variant.price == null) {
    return <span className={cx("text-stone", className)}>Price on request</span>;
  }
  const showCompare = variant.compareAtPrice != null && variant.compareAtPrice > variant.price;
  return (
    <span className={cx("inline-flex items-baseline gap-2", className)}>
      <span className="font-semibold tabular-nums text-charcoal">
        {from && <span className="mr-1 font-normal text-stone">From</span>}
        {formatPrice(variant.price)}
      </span>
      {showCompare && (
        <s className="text-sm text-stone tabular-nums">
          <span className="sr-only">Was </span>
          {formatPrice(variant.compareAtPrice!)}
        </s>
      )}
    </span>
  );
}
