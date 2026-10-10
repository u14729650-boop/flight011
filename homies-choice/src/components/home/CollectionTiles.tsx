import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { MediaKey } from "@/data/media";
import { media } from "@/data/media";
import { cx } from "@/lib/format";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { SectionHeading } from "@/components/ui/SectionHeading";

const tiles: { title: string; href: string; slot: MediaKey; caption: string }[] = [
  { title: "Designer Fragrances", href: "/collections/designer", slot: "collectionDesigner", caption: "Iconic houses" },
  { title: "Arabic Perfumes", href: "/collections/arabic", slot: "collectionArabic", caption: "Rich & long-lasting" },
  { title: "Men's Collection", href: "/collections/men", slot: "collectionMen", caption: "Fresh to intense" },
  { title: "Women's Collection", href: "/collections/women", slot: "collectionWomen", caption: "Florals, musks & ambers" },
];

const lightTones = new Set(["beige", "ivory"]);

export function CollectionTiles() {
  return (
    <section className="container-luxe py-20 md:py-28" aria-labelledby="collections-title">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading eyebrow="Shop by collection" title={<span id="collections-title">Curated for every signature</span>} />
        <Link href="/shop" className="link-underline self-start pb-1 text-sm font-semibold md:self-auto">View all fragrances</Link>
      </div>
      <ul className="mt-12 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
        {tiles.map((t, i) => {
          const light = lightTones.has(media[t.slot].tone) && !media[t.slot].src;
          return (
            <li key={t.href}>
              <Link href={t.href} className="group relative block aspect-[3/4] overflow-hidden lg:aspect-[3/4.4]">
                <EditorialImage
                  slot={t.slot}
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="absolute inset-0 transition-transform duration-[1.4s] ease-luxe group-hover:scale-[1.05]"
                />
                {!light && <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" aria-hidden="true" />}
                <div className={cx("absolute inset-0 flex flex-col justify-between p-4 md:p-7", light ? "text-charcoal" : "text-ivory")}>
                  <span className={cx("font-serif text-lg italic", light ? "text-gold-deep" : "text-gold")}>0{i + 1}</span>
                  <div>
                    <p className={cx("eyebrow hidden text-[0.6rem] sm:block", light ? "text-stone" : "text-ivory/70")}>{t.caption}</p>
                    <h3 className="display mt-2 text-[1.45rem] md:text-[2.1rem]">{t.title}</h3>
                    <span className="mt-4 inline-flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.16em] uppercase">
                      Explore <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
