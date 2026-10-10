import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { products } from "@/data/products";
import { moods, type Mood } from "@/data/taxonomy";
import { media } from "@/data/media";
import { cx } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function MoodTiles() {
  const keys = Object.keys(moods) as Mood[];
  return (
    <section className="on-dark bg-forest py-20 text-ivory md:py-28" aria-labelledby="mood-title">
      <div className="container-luxe">
        <SectionHeading
          tone="light"
          eyebrow="Shop by mood"
          title={<span id="mood-title">How do you want to feel?</span>}
          intro="Start with a feeling — we'll guide you to the fragrances that match it."
        />
        <ul className="mt-14 grid gap-px bg-ivory/10 sm:grid-cols-2 lg:grid-cols-3">
          {keys.map((key) => {
            const count = products.filter((p) => p.moods.includes(key)).length;
            const slot = `mood-${key}` as const;
            const light = (media[slot].tone === "ivory" || media[slot].tone === "beige") && !media[slot].src;
            const body = (
              <>
                <EditorialImage
                  slot={slot}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="absolute inset-0 opacity-90 transition-transform duration-[1.4s] ease-luxe group-hover:scale-[1.05]"
                />
                {!light && <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" aria-hidden="true" />}
                <div className={cx("relative flex h-full flex-col justify-end p-7", light ? "text-charcoal" : "text-ivory")}>
                  <h3 className="display text-[2rem]">{moods[key].label}</h3>
                  <p className={cx("mt-2 max-w-xs text-sm", light ? "text-stone" : "text-ivory/70")}>{moods[key].blurb}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.16em] uppercase">
                    {count > 0 ? `${count} fragrance${count > 1 ? "s" : ""}` : "Ask for recommendations"}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </>
            );
            return (
              <li key={key} className="bg-forest">
                {count > 0 ? (
                  <Link href={`/collections/${key}`} className="group relative block aspect-[4/3] overflow-hidden">
                    {body}
                  </Link>
                ) : (
                  <a
                    href={whatsappUrl(`Hello Homies Choice, could you recommend a ${moods[key].label.toLowerCase()} fragrance?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-[4/3] overflow-hidden"
                  >
                    {body}
                    <span className="sr-only"> (opens WhatsApp)</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
