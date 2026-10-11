import Link from "next/link";
import type { Product } from "@/data/products";

/** Text-only brand list, derived from what is actually in the catalogue. */
export function BrandShowcase({ products }: { products: Product[] }) {
  const brands = [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b));
  return (
    <section className="border-y border-line py-20 md:py-24" aria-labelledby="brands-title">
      <div className="container-luxe text-center">
        <p className="eyebrow text-gold-deep">Houses in our collection</p>
        <h2 id="brands-title" className="display mt-4 text-[2.5rem] sm:text-5xl">Iconic names. Exceptional fragrances.</h2>
        <ul className="mx-auto mt-12 flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14">
          {brands.map((b) => (
            <li key={b}>
              <Link
                href={`/shop?q=${encodeURIComponent(b)}`}
                className="font-serif text-[1.7rem] tracking-[0.06em] text-charcoal/80 uppercase transition-colors hover:text-emerald md:text-[2rem]"
              >
                {b}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-10 max-w-lg text-xs text-stone">
          Brand names are shown to describe the fragrances we sell and belong to their respective owners.
        </p>
      </div>
    </section>
  );
}
