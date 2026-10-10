import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { products } from "@/data/products";
import { whatsappUrl } from "@/lib/whatsapp";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppIcon } from "@/components/ui/icons";

export function Bestsellers() {
  const items = products.filter((p) => p.bestseller).slice(0, 7);
  return (
    <section className="bg-[#f1ebdf] py-20 md:py-28" aria-labelledby="bestsellers-title">
      <div className="container-luxe">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Bestsellers"
            title={<span id="bestsellers-title">The fragrances everyone&rsquo;s talking about</span>}
            intro="Explore iconic scents and modern favourites."
          />
          <Link href="/collections/bestsellers" className="link-underline self-start pb-1 text-sm font-semibold md:self-auto">
            Shop all bestsellers
          </Link>
        </div>
        <ul className="mt-14 grid grid-cols-1 gap-x-4 gap-y-12 min-[360px]:grid-cols-2 md:gap-x-5 lg:grid-cols-4 lg:gap-x-7">
          {items.map((p) => (
            <li key={p.slug} className="flex">
              <ProductCard product={p} />
            </li>
          ))}
          {items.length % 4 !== 0 && (
            <li className="on-dark min-[360px]:col-span-2 lg:col-span-1">
              <div className="flex h-full min-h-80 flex-col justify-between bg-emerald p-8 text-ivory">
                <p className="eyebrow text-gold">Looking for something else?</p>
                <div>
                  <p className="display text-[2.1rem]">Tell us the scent you love.</p>
                  <p className="mt-4 text-sm leading-relaxed text-ivory/70">
                    Our team can help you find it — or suggest something close to it.
                  </p>
                  <a
                    href={whatsappUrl("Hello Homies Choice, I'm looking for a fragrance. Could you help me?")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 inline-flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-gold uppercase hover:text-ivory"
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
