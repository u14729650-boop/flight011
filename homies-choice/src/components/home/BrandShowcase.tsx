import Link from "next/link";
import type { Product } from "@/data/products";

/** Brand names from the live catalogue, on a slow, pausable ticker. */
export function BrandShowcase({ products }: { products: Product[] }) {
  const brands = [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b));
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-4 pr-4" aria-hidden={hidden || undefined}>
      {brands.map((b) => (
        <li key={b}>
          <Link
            href={`/shop?q=${encodeURIComponent(b)}`}
            tabIndex={hidden ? -1 : undefined}
            className="glass-light inline-flex items-center gap-4 rounded-full px-8 py-4 font-serif text-[1.5rem] tracking-[0.04em] whitespace-nowrap text-charcoal/85 uppercase transition-colors hover:text-emerald md:text-[1.8rem]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
            {b}
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <section className="relative isolate overflow-hidden py-20 md:py-28" aria-labelledby="brands-title">
      <div className="orb orb-gold h-[24rem] w-[40rem] top-1/3 left-1/2 -translate-x-1/2 opacity-40" aria-hidden="true" />
      <div className="container-luxe text-center" data-reveal>
        <p className="eyebrow text-gold-deep">Houses in our collection</p>
        <h2 id="brands-title" className="display mt-4 text-[2.5rem] sm:text-5xl">Iconic names. Exceptional fragrances.</h2>
      </div>
      <div className="marquee-pause mt-12 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)] py-4">
        <div className="animate-marquee flex w-max">
          {row(false)}
          {row(true)}
        </div>
      </div>
      <p className="container-luxe mt-8 text-center text-xs text-stone">
        Brand names are shown to describe the fragrances we sell and belong to their respective owners.
      </p>
    </section>
  );
}
