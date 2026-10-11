import Link from "next/link";
import { EditorialImage } from "@/components/ui/EditorialImage";

const pillars = [
  { k: "Selection", v: "A short edit of watches chosen for design and everyday wear." },
  { k: "Guidance", v: "Ask about size, strap and fit before you buy — on WhatsApp." },
  { k: "Gifting", v: "Pair a watch with a fragrance for a complete signature." },
];

export function WatchesIntro() {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-charcoal text-ivory" aria-labelledby="watches-title">
      <EditorialImage slot="watches" priority className="absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0d0f0c]/95 via-[#0d0f0c]/70 to-transparent" aria-hidden="true" />
      <div className="container-luxe py-16 md:py-24">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-xs text-ivory/60">
            <li><Link href="/" className="hover:text-gold">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ivory/85">Watches</li>
          </ol>
        </nav>
        <p className="eyebrow mt-10 text-gold">The watch edit</p>
        <h1 id="watches-title" className="display mt-5 max-w-3xl text-[3.2rem] text-balance sm:text-7xl lg:text-[5.6rem]">
          Time, <em className="text-gold">well kept.</em>
        </h1>
        <p className="mt-6 max-w-lg leading-relaxed text-ivory/70">
          Timepieces chosen with the same care as our fragrances — refined, wearable and made to become part of your signature.
        </p>
        <dl className="mt-14 grid max-w-4xl gap-8 border-t border-ivory/15 pt-8 sm:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.k}>
              <dt className="eyebrow text-[0.6rem] text-gold">{p.k}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ivory/70">{p.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
