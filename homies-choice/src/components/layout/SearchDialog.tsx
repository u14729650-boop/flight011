"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { useCatalogue } from "@/components/catalogue/CatalogueProvider";
import { matchesQuery } from "@/lib/catalogue";
import { ProductImage } from "@/components/product/ProductImage";

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const products = useCatalogue();
  const [q, setQ] = useState("");
  const router = useRouter();
  const results = useMemo(() => (q.trim() ? products.filter((p) => matchesQuery(p, q)).slice(0, 6) : []), [q, products]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    onOpenChange(false);
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQ(""); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="anim-overlay fixed inset-0 z-50 bg-forest/70 backdrop-blur-[2px]" />
        <Dialog.Content className="anim-overlay fixed inset-x-0 top-0 z-50 max-h-[90vh] overflow-y-auto bg-ivory shadow-2xl">
          <div className="container-luxe py-8 md:py-12">
            <div className="flex items-center justify-between">
              <Dialog.Title className="eyebrow text-gold-deep">Search the collection</Dialog.Title>
              <Dialog.Close className="-mr-2 inline-flex h-11 w-11 items-center justify-center hover:text-gold-deep" aria-label="Close search">
                <X className="h-5 w-5" strokeWidth={1.4} />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Search by product name or brand.</Dialog.Description>
            <form onSubmit={submit} role="search" className="mt-4 flex items-center gap-4 border-b border-charcoal/70 pb-3">
              <Search className="h-6 w-6 shrink-0 text-stone" strokeWidth={1.2} aria-hidden="true" />
              <label htmlFor="site-search" className="sr-only">Product name or brand</label>
              <input
                id="site-search"
                autoFocus
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Perfume, watch or brand"
                className="w-full bg-transparent font-serif text-2xl text-charcoal outline-none placeholder:text-stone/60 md:text-4xl"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-dark hidden md:inline-flex">Search</button>
            </form>

            {q.trim() ? (
              <div className="mt-8" aria-live="polite">
                {results.length ? (
                  <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/products/${p.slug}`} onClick={() => onOpenChange(false)} className="group flex items-center gap-4 py-1">
                          <ProductImage product={p} variant="thumb" className="h-20 w-16 shrink-0" sizes="64px" />
                          <span>
                            <span className="eyebrow block text-[0.6rem] text-gold-deep">{p.brand}</span>
                            <span className="font-serif text-xl group-hover:text-emerald">{p.name}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-stone">
                    No perfumes match “{q.trim()}”. Try a brand name, or{" "}
                    <Link href="/contact" onClick={() => onOpenChange(false)} className="underline underline-offset-4">ask us on WhatsApp</Link> — we may be able to source it.
                  </p>
                )}
                {results.length > 0 && (
                  <button type="button" onClick={submit} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold hover:text-emerald">
                    See all results <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-8">
                <p className="eyebrow text-[0.6rem] text-stone">Popular houses</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {brands.map((b) => (
                    <li key={b}>
                      <button type="button" onClick={() => setQ(b)} className="border border-line px-4 py-2 text-sm hover:border-emerald">
                        {b}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
