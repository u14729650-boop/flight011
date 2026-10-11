"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { type ProductCategory } from "@/data/products";
import { useCatalogue } from "./CatalogueProvider";
import type { CollectionScope } from "@/data/collections";
import { fragranceFamilies, genderLabels, originLabels, type FragranceFamily, type Gender, type Origin } from "@/data/taxonomy";
import {
  activeFilterCount,
  applyFilters,
  availableFamilies,
  availableSizes,
  inScope,
  parseFilters,
  serializeFilters,
  sortOptions,
  type CatalogueFilters,
  type SortKey,
} from "@/lib/catalogue";
import { cx, formatPrice } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";
import { ProductCard } from "@/components/product/ProductCard";
import { WhatsAppIcon } from "@/components/ui/icons";

function countNoun(n: number, kind: "watch" | "fragrance" | "product") {
  const plural = { watch: "watches", fragrance: "fragrances", product: "products" }[kind];
  return n === 1 ? kind : plural;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function Catalogue({
  scope,
  showSearch = true,
  emptyCopy,
}: {
  scope?: CollectionScope;
  showSearch?: boolean;
  emptyCopy?: { eyebrow: string; title: string; body: string; ask: string };
}) {
  const products = useCatalogue();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState(filters.q);

  useEffect(() => setQuery(filters.q), [filters.q]);

  const scoped = useMemo(() => products.filter((p) => inScope(p, scope)), [products, scope]);
  const results = useMemo(() => applyFilters(scoped, filters), [scoped, filters]);
  const facets = useMemo(
    () => ({
      categories: (["fragrance", "watch"] as ProductCategory[]).filter((c) => scoped.some((p) => p.category === c)),
      genders: (["men", "women", "unisex"] as Gender[]).filter((g) => scoped.some((p) => p.gender === g)),
      origins: (["designer", "arabic"] as Origin[]).filter((o) => scoped.some((p) => p.category === "fragrance" && p.origin === o)),
      families: availableFamilies(scoped),
      sizes: availableSizes(scoped),
    }),
    [scoped],
  );

  const update = (next: Partial<CatalogueFilters>) => {
    const qs = serializeFilters({ ...filters, ...next });
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Debounce free-text search into the URL.
  useEffect(() => {
    if (query === filters.q) return;
    const t = window.setTimeout(() => update({ q: query }), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const reset = () => {
    setQuery("");
    router.replace(pathname, { scroll: false });
  };

  const count = activeFilterCount(filters);
  const hasAnyFilter = count > 0 || filters.q.trim() !== "";
  const priceActive = filters.minPrice != null || filters.maxPrice != null;
  const hiddenUnpriced = priceActive ? scoped.filter((p) => p.variants.every((v) => v.price == null)).length : 0;

  const filterPanel = (
    <FilterPanel
      filters={filters}
      facets={facets}
      onChange={update}
      showGender={!scope?.gender}
      showOrigin={!scope?.origin}
    />
  );

  return (
    <div className="container-luxe pb-24">
      {/* Toolbar */}
      <div className="glass-light sticky top-[4.75rem] z-20 mt-6 flex flex-wrap items-center gap-3 rounded-[1.5rem] px-4 py-3 md:rounded-full md:px-5 lg:top-[8.4rem]">
        {showSearch && (
          <div className="relative order-first w-full sm:order-none sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-stone" strokeWidth={1.5} aria-hidden="true" />
            <label htmlFor="catalogue-search" className="sr-only">Search by name or brand</label>
            <input
              id="catalogue-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or brand"
              className="field !mt-0 !rounded-full py-2.5 pl-11 text-sm"
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white/70 px-4 text-xs font-medium tracking-[0.12em] uppercase hover:border-charcoal lg:hidden"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters{count > 0 && ` (${count})`}
        </button>
        <p className="text-sm text-stone" aria-live="polite" data-testid="result-count">
          {results.length} {countNoun(results.length, scope?.category === "watch" ? "watch" : results.every((p) => p.category === "fragrance") ? "fragrance" : "product")}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="catalogue-sort" className="eyebrow hidden text-[0.6rem] text-stone sm:block">Sort</label>
          <select
            id="catalogue-sort"
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as SortKey })}
            className="h-10 rounded-full border border-line bg-white/70 px-4 text-sm hover:border-charcoal"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter chips */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-2 pt-5" aria-label="Active filters">
          {filters.category.map((c) => <Chip key={c} label={c === "watch" ? "Watches" : "Fragrances"} onRemove={() => update({ category: toggle(filters.category, c) })} />)}
          {filters.q.trim() && <Chip label={`“${filters.q.trim()}”`} onRemove={() => { setQuery(""); update({ q: "" }); }} />}
          {filters.gender.map((g) => <Chip key={g} label={genderLabels[g]} onRemove={() => update({ gender: toggle(filters.gender, g) })} />)}
          {filters.origin.map((o) => <Chip key={o} label={originLabels[o]} onRemove={() => update({ origin: toggle(filters.origin, o) })} />)}
          {filters.family.map((f) => <Chip key={f} label={fragranceFamilies[f]} onRemove={() => update({ family: toggle(filters.family, f) })} />)}
          {filters.size.map((s) => <Chip key={s} label={`${s} ml`} onRemove={() => update({ size: toggle(filters.size, s) })} />)}
          {filters.minPrice != null && <Chip label={`From ${formatPrice(filters.minPrice)}`} onRemove={() => update({ minPrice: null })} />}
          {filters.maxPrice != null && <Chip label={`Up to ${formatPrice(filters.maxPrice)}`} onRemove={() => update({ maxPrice: null })} />}
          <button type="button" onClick={reset} className="ml-1 text-xs font-semibold underline underline-offset-4 hover:text-emerald">
            Clear all
          </button>
        </div>
      )}

      <div className={cx("mt-8 grid gap-10 lg:gap-14", scoped.length > 0 && "lg:grid-cols-[15rem_1fr]")}>
        <aside className={cx("hidden", scoped.length > 0 && "lg:block")} aria-label="Filters">
          <div className="glass-light sticky top-[13.5rem] rounded-[1.5rem] p-6">{filterPanel}</div>
        </aside>

        <div>
          {hiddenUnpriced > 0 && (
            <p className="glass-light mb-6 rounded-2xl px-5 py-3 text-sm text-stone">
              {hiddenUnpriced} fragrance{hiddenUnpriced > 1 ? "s" : ""} with price on request {hiddenUnpriced > 1 ? "are" : "is"} hidden while a price range is set.
            </p>
          )}
          {results.length > 0 ? (
            <ul className="grid grid-cols-1 gap-x-4 gap-y-12 min-[360px]:grid-cols-2 md:gap-x-5 xl:grid-cols-3 xl:gap-x-7">
              {results.map((p, i) => (
                <li key={p.slug} className="flex" data-reveal data-reveal-delay={(i % 3) * 90}>
                  <ProductCard product={p} priority={i < 3} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState filtered={hasAnyFilter || scoped.length > 0} onReset={reset} copy={emptyCopy} />
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="anim-overlay fixed inset-0 z-50 bg-forest/50 backdrop-blur-md" />
          <Dialog.Content className="anim-drawer fixed inset-y-2 right-2 z-50 flex w-[86vw] max-w-sm flex-col overflow-hidden rounded-[2rem] bg-ivory shadow-2xl">
            <div className="flex h-[4.25rem] items-center justify-between border-b border-line px-6">
              <Dialog.Title className="eyebrow">Filters</Dialog.Title>
              <Dialog.Close className="-mr-2 inline-flex h-11 w-11 items-center justify-center" aria-label="Close filters">
                <X className="h-5 w-5" strokeWidth={1.4} />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Refine the fragrances shown.</Dialog.Description>
            <div className="flex-1 overflow-y-auto px-6 py-6">{filterPanel}</div>
            <div className="grid grid-cols-2 gap-2 border-t border-line p-5">
              <button type="button" onClick={reset} className="btn btn-outline-dark px-2">Reset</button>
              <Dialog.Close className="btn btn-dark px-2">Show {results.length}</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-white/70 px-3.5 text-xs transition-colors hover:border-charcoal"
      aria-label={`Remove filter ${label}`}
    >
      {label} <X className="h-3 w-3" />
    </button>
  );
}

function EmptyState({
  filtered,
  onReset,
  copy,
}: {
  filtered: boolean;
  onReset: () => void;
  copy?: { eyebrow: string; title: string; body: string; ask: string };
}) {
  return (
    <div className="glass-light relative isolate flex flex-col items-center overflow-hidden rounded-[2rem] px-6 py-20 text-center">
      <div className="orb orb-gold h-72 w-72 -top-20 left-1/2 -translate-x-1/2 opacity-50" aria-hidden="true" />
      <p className="eyebrow text-gold-deep">{filtered ? "No exact match" : copy?.eyebrow ?? "Coming soon"}</p>
      <p className="display mt-4 text-4xl text-balance">{filtered ? "Nothing matches those filters." : copy?.title ?? "This selection is being curated."}</p>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-stone">
        {filtered
          ? "Try removing a filter — or tell us what you're looking for and we'll check what we can source for you."
          : copy?.body ?? "Our team is adding fragrances to this collection. Message us and we'll share what's available in store today."}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {filtered ? (
          <button type="button" onClick={onReset} className="btn btn-dark">Clear filters</button>
        ) : (
          <Link href="/shop" className="btn btn-dark">Browse all fragrances</Link>
        )}
        <a
          href={whatsappUrl(!filtered && copy ? copy.ask : "Hello Homies Choice, I'm looking for something I couldn't find on the website.")}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline-dark"
        >
          <WhatsAppIcon className="h-4 w-4" /> Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line pb-6 last:border-b-0 last:pb-0 [&:not(:first-child)]:pt-6">
      <legend className="eyebrow float-left mb-4 w-full text-[0.62rem] text-charcoal">{title}</legend>
      <div className="clear-both space-y-1">{children}</div>
    </fieldset>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-3 text-sm text-charcoal/85 hover:text-charcoal">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-emerald" />
      {label}
    </label>
  );
}

function FilterPanel({
  filters,
  facets,
  onChange,
  showGender,
  showOrigin,
}: {
  filters: CatalogueFilters;
  facets: { categories: ProductCategory[]; genders: Gender[]; origins: Origin[]; families: FragranceFamily[]; sizes: number[] };
  onChange: (f: Partial<CatalogueFilters>) => void;
  showGender: boolean;
  showOrigin: boolean;
}) {
  const [min, setMin] = useState(filters.minPrice?.toString() ?? "");
  const [max, setMax] = useState(filters.maxPrice?.toString() ?? "");
  useEffect(() => setMin(filters.minPrice?.toString() ?? ""), [filters.minPrice]);
  useEffect(() => setMax(filters.maxPrice?.toString() ?? ""), [filters.maxPrice]);

  const applyPrice = (e?: React.FormEvent) => {
    e?.preventDefault();
    const lo = min.trim() === "" ? null : Math.max(0, Number(min));
    const hi = max.trim() === "" ? null : Math.max(0, Number(max));
    const valid = (n: number | null) => (n == null || Number.isFinite(n) ? n : null);
    let a = valid(lo);
    let b = valid(hi);
    if (a != null && b != null && a > b) [a, b] = [b, a];
    onChange({ minPrice: a, maxPrice: b });
  };

  return (
    <div>
      {facets.categories.length > 1 && (
        <FilterGroup title="Category">
          {facets.categories.map((c) => (
            <Check
              key={c}
              label={c === "watch" ? "Watches" : "Fragrances"}
              checked={filters.category.includes(c)}
              onChange={() => onChange({ category: toggle(filters.category, c) })}
            />
          ))}
        </FilterGroup>
      )}
      {showGender && facets.genders.length > 0 && (
        <FilterGroup title="For">
          {facets.genders.map((g) => (
            <Check key={g} label={genderLabels[g]} checked={filters.gender.includes(g)} onChange={() => onChange({ gender: toggle(filters.gender, g) })} />
          ))}
        </FilterGroup>
      )}
      {showOrigin && facets.origins.length > 0 && (
        <FilterGroup title="Type">
          {facets.origins.map((o) => (
            <Check
              key={o}
              label={o === "arabic" ? "Arabic perfumes" : "Designer fragrances"}
              checked={filters.origin.includes(o)}
              onChange={() => onChange({ origin: toggle(filters.origin, o) })}
            />
          ))}
        </FilterGroup>
      )}
      {facets.families.length > 0 && (
        <FilterGroup title="Fragrance family">
          {facets.families.map((f) => (
            <Check key={f} label={fragranceFamilies[f]} checked={filters.family.includes(f)} onChange={() => onChange({ family: toggle(filters.family, f) })} />
          ))}
        </FilterGroup>
      )}
      {facets.sizes.length > 0 && (
        <FilterGroup title="Bottle size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const on = filters.size.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange({ size: toggle(filters.size, s) })}
                  className={cx("h-9 min-w-16 rounded-full border px-4 text-sm transition-colors", on ? "border-emerald bg-emerald text-ivory" : "border-line bg-white/70 hover:border-charcoal")}
                >
                  {s} ml
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}
      <FilterGroup title="Price (₹)">
        <form onSubmit={applyPrice} className="flex items-end gap-3">
          <label className="flex-1 text-xs text-stone">
            Min
            <input inputMode="numeric" type="number" min={0} value={min} onChange={(e) => setMin(e.target.value)} onBlur={() => applyPrice()} className="field py-2" />
          </label>
          <span className="pb-2 text-stone" aria-hidden="true">–</span>
          <label className="flex-1 text-xs text-stone">
            Max
            <input inputMode="numeric" type="number" min={0} value={max} onChange={(e) => setMax(e.target.value)} onBlur={() => applyPrice()} className="field py-2" />
          </label>
          <button type="submit" className="sr-only">Apply price range</button>
        </form>
      </FilterGroup>
    </div>
  );
}

