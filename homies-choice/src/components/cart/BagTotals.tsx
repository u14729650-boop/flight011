import { formatPrice } from "@/lib/format";
import type { CartSummary } from "@/lib/cart";

export function BagTotals({ summary }: { summary: Pick<CartSummary, "subtotal" | "unpricedLines" | "lines"> }) {
  const allUnpriced = summary.unpricedLines === summary.lines.length;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow text-[0.65rem] text-stone">Product subtotal</span>
        <span className="font-serif text-2xl tabular-nums text-charcoal" data-testid="bag-subtotal">
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
