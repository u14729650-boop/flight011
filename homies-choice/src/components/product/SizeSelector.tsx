"use client";

import type { ProductVariant } from "@/data/products";
import { cx, variantLabel } from "@/lib/format";

export function SizeSelector({
  variants,
  value,
  onChange,
  name,
  category = "fragrance",
}: {
  variants: ProductVariant[];
  value: string;
  onChange: (id: string) => void;
  name: string;
  category?: "fragrance" | "watch";
}) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3 text-[0.625rem] text-stone">{category === "watch" ? "Option" : "Bottle size"}</legend>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const selected = v.id === value;
          const sold = v.availability === "out_of_stock";
          return (
            <label
              key={v.id}
              className={cx(
                "relative inline-flex min-h-11 min-w-20 cursor-pointer items-center justify-center border px-4 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-deep",
                selected ? "border-emerald bg-emerald text-ivory" : "border-line hover:border-charcoal",
                sold && "text-stone line-through",
              )}
            >
              <input
                type="radio"
                name={name}
                value={v.id}
                checked={selected}
                onChange={() => onChange(v.id)}
                className="sr-only"
              />
              {variantLabel(v, category)}
              {sold && <span className="sr-only"> (out of stock)</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
