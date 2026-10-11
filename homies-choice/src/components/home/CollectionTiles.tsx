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
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between" data-reveal>
        <SectionHeading eyebrow="Shop by collection" title={<span id="collections-title">Curated for every signature</span>} />
        <Link href="/shop" className="btn btn-outline-dark self-start md:self-auto">View all fragrances</Link>
      </div>
      <ul className="mt-12 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
        {tiles.map((t, i) => {
          const light = lightTones.has(media[t.slot].tone);
          return (
            <li key={t.href} data-reveal data-reveal-delay={i * 110}>
              <Link href={t.href} className="lift group relative block aspect-[3/4] overflow-hidden rounded-[1.75rem] lg:aspect-[3/4.4]">
                <EditorialImage
                  slot={t.slot}
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="absolute inset-0 transition-transform duration-[1.6s] ease-luxe group-hover:scale-[1.08]"
                />
                <span
                  className={cx(
                    "absolute top-4 left-4 rounded-full px-3 py-1.5 text-[0.55rem] font-medium tracking-[0.18em] uppercase md:top-5 md:left-5",
                    light ? "glass-light text-gold-deep" : "glass text-ivory",
                  )}
                >
                  {t.caption}
                </span>
                <div
                  className={cx(
                    "absolute inset-x-2.5 bottom-2.5 flex items-end justify-between gap-3 rounded-[1.25rem] p-4 transition-transform duration-500 ease-luxe group-hover:-translate-y-1 md:inset-x-3 md:bottom-3 md:p-5",
                    light ? "glass-light text-charcoal" : "glass text-ivory",
                  )}
                >
                  <h3 className="display text-[1.3rem] md:text-[1.75rem]">{t.title}</h3>
                  <span
                    className={cx(
                      "hidden h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-500 group-hover:rotate-45 md:flex",
                      light ? "bg-emerald text-ivory" : "bg-gold text-forest",
                    )}
                    aria-hidden="true"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
