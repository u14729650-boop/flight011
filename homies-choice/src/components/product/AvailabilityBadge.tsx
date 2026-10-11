import type { Availability } from "@/data/products";
import { availabilityLabel, cx } from "@/lib/format";

const dot: Record<Availability, string> = {
  in_stock: "bg-[#2f7d5b]",
  low_stock: "bg-[#c08a2e]",
  out_of_stock: "bg-[#9b2c2c]",
  on_request: "bg-gold",
};

export function AvailabilityBadge({ availability, className }: { availability: Availability; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2 text-xs text-stone", className)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", dot[availability])} aria-hidden="true" />
      {availabilityLabel[availability]}
    </span>
  );
}
