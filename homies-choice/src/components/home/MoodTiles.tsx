import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/data/products";
import { moods, type Mood } from "@/data/taxonomy";
import { media } from "@/data/media";
import { cx } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function MoodTiles({ products }: { products: Product[] }) {
  const keys = Object.keys(moods) as Mood[];
  return (
    <section className="on-dark relative isolate overflow-hidden bg-forest py-20 text-ivory md:py-28" aria-labelledby="mood-title">
      <div className="orb orb-emerald h-[34rem] w-[34rem] -top-40 -left-40" aria-hidden="true" />
      <div className="orb orb-gold h-[26rem] w-[26rem] -right-24 bottom-0 opacity-30" aria-hidden="true" />
      <div className="container-luxe">
        <div data-reveal>
          <SectionHeading
            tone="light"
            eyebrow="Shop by mood"
            title={<span id="mood-title">How do you want to feel?</span>}
            intro="Start with a feeling — we'll guide you to the fragrances that match it."
          />
        </div>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {keys.map((key, i) => {
            const count = products.filter((p) => p.moods.includes(key)).length;
            const slot = `mood-${key}` as const;
            const light = media[slot].tone === "ivory" || media[slot].tone === "beige";
            const body = (
              <>
                <EditorialImage
                  slot={slot}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="absolute inset-0 transition-transform duration-[1.6s] ease-luxe group-hover:scale-[1.08]"
                />
                <div
                  className={cx(
                    "absolute inset-x-3 bottom-3 rounded-[1.25rem] p-5 transition-transform duration-500 ease-luxe group-hover:-translate-y-1",
                    light ? "glass-light text-charcoal" : "glass text-ivory",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="display text-[1.65rem]">{moods[key].label}</h3>
                    <span
                      className={cx(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-500 group-hover:rotate-45",
                        light ? "bg-emerald text-ivory" : "bg-gold text-forest",
                      )}
                      aria-hidden="true"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <p className={cx("mt-1.5 max-w-xs text-[0.82rem] leading-relaxed", light ? "text-charcoal/75" : "text-ivory/75")}>{moods[key].blurb}</p>
                  <p className={cx("eyebrow mt-3 text-[0.58rem]", light ? "text-gold-deep" : "text-gold")}>
                    {count > 0 ? `${count} fragrance${count > 1 ? "s" : ""}` : "Ask for recommendations"}
                  </p>
                </div>
              </>
            );
            const cls = "lift group relative block aspect-[4/3.4] overflow-hidden rounded-[1.75rem]";
            return (
              <li key={key} data-reveal data-reveal-delay={(i % 3) * 110}>
                {count > 0 ? (
                  <Link href={`/collections/${key}`} className={cls}>
                    {body}
                  </Link>
                ) : (
                  <a
                    href={whatsappUrl(`Hello Homies Choice, could you recommend a ${moods[key].label.toLowerCase()} fragrance?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
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
