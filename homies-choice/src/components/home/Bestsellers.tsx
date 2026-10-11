import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/data/products";
import type { StoreSettings } from "@/lib/store-settings";
import { whatsappFor } from "@/lib/whatsapp";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppIcon } from "@/components/ui/icons";

export function Bestsellers({ products, settings }: { products: Product[]; settings: StoreSettings }) {
  const wa = whatsappFor(settings);
  const items = products.filter((p) => p.bestseller && p.category === "fragrance").slice(0, 7);
  return (
    <section className="relative isolate overflow-hidden bg-[#f1ebdf] py-20 md:py-28" aria-labelledby="bestsellers-title">
      <div className="orb orb-gold h-[30rem] w-[30rem] -top-24 right-[10%] opacity-50" aria-hidden="true" />
      <div className="orb orb-ivory h-[36rem] w-[36rem] bottom-0 -left-32" aria-hidden="true" />
      <div className="container-luxe">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between" data-reveal>
          <SectionHeading
            eyebrow="Bestsellers"
            title={<span id="bestsellers-title">The fragrances everyone&rsquo;s talking about</span>}
            intro="Explore iconic scents and modern favourites."
          />
          <Link href="/collections/bestsellers" className="btn btn-outline-dark self-start md:self-auto">
            Shop all bestsellers
          </Link>
        </div>
        <ul className="mt-14 grid grid-cols-1 gap-x-4 gap-y-12 min-[360px]:grid-cols-2 md:gap-x-5 lg:grid-cols-4 lg:gap-x-7">
          {items.map((p, i) => (
            <li key={p.slug} className="flex" data-reveal data-reveal-delay={(i % 4) * 100}>
              <ProductCard product={p} />
            </li>
          ))}
          {items.length % 4 !== 0 && (
            <li className="on-dark min-[360px]:col-span-2 lg:col-span-1" data-reveal data-reveal-delay={300}>
              <div className="relative isolate flex h-full min-h-80 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-emerald p-8 text-ivory">
                <div className="orb orb-gold h-56 w-56 -top-16 -right-16 opacity-60" aria-hidden="true" />
                <p className="eyebrow text-gold">Looking for something else?</p>
                <div>
                  <p className="display text-[2.1rem]">Tell us the scent you love.</p>
                  <p className="mt-4 text-sm leading-relaxed text-ivory/70">
                    Our team can help you find it — or suggest something close to it.
                  </p>
                  <a
                    href={wa("Hello Homies Choice, I'm looking for a fragrance. Could you help me?")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-gold mt-7"
                  >
                    <WhatsAppIcon className="h-4 w-4" /> Ask on WhatsApp <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
