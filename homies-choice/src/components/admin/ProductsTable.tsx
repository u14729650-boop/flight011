"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import { productTitle, type ProductCategory } from "@/data/products";
import { availabilityLabel, cx, formatPrice, variantLabel } from "@/lib/format";
import { ProductImage } from "@/components/product/ProductImage";
import { useAdminData } from "./AdminShell";
import { AdminPageHeader, Badge, Notice, Spinner } from "./ui";

const tabs: { value: "all" | ProductCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fragrance", label: "Fragrances" },
  { value: "watch", label: "Watches" },
];

export function ProductsTable() {
  const { products, error } = useAdminData();
  const [tab, setTab] = useState<"all" | ProductCategory>("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (products ?? []).filter(
      (p) => (tab === "all" || p.category === tab) && (!term || `${p.brand} ${p.name}`.toLowerCase().includes(term)),
    );
  }, [products, tab, q]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        actions={
          <>
            <Link href="/hc-admin/products/new?category=fragrance" className="btn btn-dark min-h-10 py-2 px-4">
              <Plus className="h-4 w-4" /> Add perfume
            </Link>
            <Link href="/hc-admin/products/new?category=watch" className="btn btn-outline-dark min-h-10 py-2 px-4">
              <Plus className="h-4 w-4" /> Add watch
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-full border border-line bg-white/70 p-1" role="tablist" aria-label="Filter by category">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cx("rounded-full px-4 py-2 text-xs font-medium tracking-[0.1em] uppercase transition-colors", tab === t.value ? "bg-emerald text-ivory" : "text-stone hover:text-charcoal")}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden="true" />
          <label htmlFor="admin-product-search" className="sr-only">Search products</label>
          <input
            id="admin-product-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or brand"
            className="w-full rounded-full border border-line bg-white py-2.5 pr-4 pl-9 text-sm focus:border-emerald focus:outline-none"
          />
        </div>
      </div>

      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : !products ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-line px-6 py-16 text-center">
          <p className="font-serif text-3xl">{tab === "watch" ? "No watches yet." : "No products match."}</p>
          <p className="mt-2 text-sm text-stone">
            {tab === "watch" ? "Add your first watch and it will appear on the Watches page." : "Try a different search."}
          </p>
          {tab === "watch" && (
            <Link href="/hc-admin/products/new?category=watch" className="btn btn-dark mt-6">
              <Plus className="h-4 w-4" /> Add watch
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Phones: one tappable card per product instead of a sideways-scrolling table. */}
          <ul className="space-y-3 md:hidden">
            {rows.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/hc-admin/products/${p.slug}`}
                  aria-label={`Edit ${productTitle(p)}`}
                  className="flex items-center gap-3 rounded-[1.5rem] border border-white/80 bg-white/75 p-3 shadow-[0_20px_50px_-35px_rgba(6,59,46,0.35)] backdrop-blur-xl active:bg-white"
                >
                  <ProductImage product={p} variant="thumb" className="h-20 w-16 shrink-0 rounded-xl" sizes="64px" />
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow truncate text-[0.55rem] text-gold-deep">{p.brand}</p>
                    <p className="font-serif text-lg leading-tight">{p.name}</p>
                    <p className="mt-0.5 truncate text-xs text-stone tabular-nums">
                      {p.variants.map((v) => `${variantLabel(v, p.category)} · ${v.price == null ? "no price" : formatPrice(v.price)}`).join("  /  ")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.published ? <Badge tone="good">Live</Badge> : <Badge>Draft</Badge>}
                      {p.bestseller && <Badge tone="gold">Bestseller</Badge>}
                      {!p.images.length && <Badge tone="warn">No photo</Badge>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-[1.5rem] border border-white/80 bg-white/75 shadow-[0_20px_50px_-35px_rgba(6,59,46,0.35)] backdrop-blur-xl md:block">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="border-b border-line text-[0.62rem] tracking-[0.14em] text-stone uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Options &amp; prices</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Stock</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Edit</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((p) => (
                  <tr key={p.slug} className="align-top hover:bg-ivory/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage product={p} variant="thumb" className="h-14 w-11 shrink-0" sizes="44px" />
                        <div className="min-w-0">
                          <p className="eyebrow text-[0.55rem] text-gold-deep">{p.brand}</p>
                          <p className="font-serif text-lg leading-tight">{p.name}</p>
                          <p className="text-xs text-stone">{p.category === "watch" ? "Watch" : "Fragrance"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {p.variants.map((v) => (
                          <li key={v.id} className="flex gap-3 tabular-nums">
                            <span className="min-w-20 text-stone">{variantLabel(v, p.category)}</span>
                            <span className={v.price == null ? "text-[#7a5410]" : ""}>{v.price == null ? "No price" : formatPrice(v.price)}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone">
                      {[...new Set(p.variants.map((v) => availabilityLabel[v.availability]))].join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {p.published ? <Badge tone="good">Live</Badge> : <Badge>Draft</Badge>}
                        {p.bestseller && <Badge tone="gold">Bestseller</Badge>}
                        {!p.images.length && <Badge tone="warn">No photo</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/hc-admin/products/${p.slug}`} className="text-xs font-semibold tracking-[0.1em] uppercase hover:text-emerald">
                        Edit<span className="sr-only"> {productTitle(p)}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
