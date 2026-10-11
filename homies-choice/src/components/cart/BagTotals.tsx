import { cx, formatPrice } from "@/lib/format";
import type { CartSummary } from "@/lib/cart";

export function BagTotals({ summary }: { summary: Pick<CartSummary, "subtotal" | "unpricedLines" | "lines"> }) {
  const allUnpriced = summary.unpricedLines === summary.lines.length;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="eyebrow text-[0.65rem] whitespace-nowrap text-stone">Product subtotal</span>
        <span className={cx("ml-auto text-right font-serif tabular-nums text-charcoal", allUnpriced ? "text-xl" : "text-2xl")} data-testid="bag-subtotal">
          {allUnpriced ? "To be confirmed" : formatPrice(summary.subtotal)}
        </span>
      </div>
      {summary.unpricedLines > 0 && !allUnpriced && (
        <p className="text-xs text-stone">
          Plus {summary.unpricedLines} item{summary.unpricedLines > 1 ? "s" : ""} with price on request.
        </p>
      )}
      <p className="text-xs leading-relaxed text-stone">
        {allUnpriced
          ? "Our team will share prices for these fragrances on WhatsApp."
          : "Delivery charges and final amount are confirmed by our team on WhatsApp."}
      </p>
    </div>
  );
}
