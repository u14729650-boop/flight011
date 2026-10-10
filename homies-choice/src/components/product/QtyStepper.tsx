"use client";

import { Minus, Plus } from "lucide-react";
import { MAX_QTY } from "@/lib/cart";
import { cx } from "@/lib/format";

export function QtyStepper({
  value,
  onChange,
  min = 1,
  label,
  size = "md",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  label: string;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-9" : "h-12";
  return (
    <div className={cx("inline-flex items-center border border-line", h)} role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className={cx("inline-flex items-center justify-center hover:text-emerald disabled:opacity-30", h, size === "sm" ? "w-9" : "w-11")}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={cx("min-w-8 text-center tabular-nums", size === "sm" ? "text-sm" : "")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QTY}
        className={cx("inline-flex items-center justify-center hover:text-emerald disabled:opacity-30", h, size === "sm" ? "w-9" : "w-11")}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
