import Link from "next/link";
import { media as mediaSlots, type MediaKey } from "@/data/media";
import { EditorialImage } from "./EditorialImage";

export function PageIntro({
  eyebrow,
  title,
  intro,
  crumbs,
  media,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  crumbs?: { label: string; href?: string }[];
  media?: MediaKey;
}) {
  return (
    <section className="on-dark relative isolate overflow-hidden rounded-b-[2.5rem] bg-forest text-ivory">
      {/* Only use the photo slot once a real photograph exists; otherwise keep the emerald backdrop. */}
      {media && mediaSlots[media].src && !["beige", "ivory"].includes(mediaSlots[media].tone) ? <EditorialImage slot={media} priority className="absolute inset-0 -z-10 opacity-60" /> : <div className="tone-emerald grain absolute inset-0 -z-10" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest/90 via-forest/60 to-forest/20" aria-hidden="true" />
      <div className="orb orb-gold -z-10 h-80 w-80 -top-20 right-[12%] opacity-35" aria-hidden="true" />
      <div className="container-luxe animate-fade-up py-14 md:py-20">
        {crumbs && (
          <nav aria-label="Breadcrumb">
            <ol className="glass inline-flex flex-wrap items-center gap-2 rounded-full px-4 py-2 text-xs text-ivory/70">
              {crumbs.map((c, i) => (
                <li key={c.label} className="flex items-center gap-2">
                  {c.href ? <Link href={c.href} className="hover:text-gold">{c.label}</Link> : <span aria-current="page" className="text-ivory/85">{c.label}</span>}
                  {i < crumbs.length - 1 && <span aria-hidden="true">/</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="eyebrow mt-8 text-gold">{eyebrow}</p>}
        <h1 className="display mt-4 max-w-4xl text-[3rem] sm:text-6xl lg:text-7xl">{title}</h1>
        {intro && <p className="mt-5 max-w-xl leading-relaxed font-light text-ivory/75">{intro}</p>}
      </div>
    </section>
  );
}
