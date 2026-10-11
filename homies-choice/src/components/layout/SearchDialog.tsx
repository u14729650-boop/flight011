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
        <Dialog.Overlay className="anim-overlay fixed inset-0 z-50 bg-forest/50 backdrop-blur-md" />
        <Dialog.Content className="anim-drop fixed inset-x-2 top-2 z-50 max-h-[90vh] overflow-y-auto rounded-[2rem] bg-ivory/95 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl md:inset-x-6 md:top-6">
          <div className="container-luxe py-8 md:py-12">
            <div className="flex items-center justify-between">
              <Dialog.Title className="eyebrow text-gold-deep">Search the collection</Dialog.Title>
              <Dialog.Close className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-charcoal/5 hover:text-gold-deep" aria-label="Close search">
                <X className="h-5 w-5" strokeWidth={1.4} />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Search by product name or brand.</Dialog.Description>
            <form onSubmit={submit} role="search" className="mt-4 flex items-center gap-4 rounded-full border border-line bg-white px-6 py-3 shadow-[0_10px_30px_-20px_rgba(6,59,46,0.5)] focus-within:border-emerald">
              <Search className="h-6 w-6 shrink-0 text-stone" strokeWidth={1.2} aria-hidden="true" />
              <label htmlFor="site-search" className="sr-only">Product name or brand</label>
              <input
                id="site-search"
                autoFocus
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Perfume, watch or brand"
                className="w-full bg-transparent font-serif text-xl text-charcoal outline-none placeholder:text-stone/60 md:text-3xl"
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
                        <Link href={`/products/${p.slug}`} onClick={() => onOpenChange(false)} className="group flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-white">
                          <ProductImage product={p} variant="thumb" className="h-20 w-16 shrink-0 rounded-xl" sizes="64px" />
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
                      <button type="button" onClick={() => setQ(b)} className="rounded-full border border-line bg-white/70 px-5 py-2 text-sm transition-colors hover:border-emerald hover:bg-white">
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
