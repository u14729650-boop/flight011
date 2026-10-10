import Link from "next/link";
import { media } from "@/data/media";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { Monogram } from "@/components/ui/Logo";

export function Hero() {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-forest text-ivory" aria-labelledby="hero-title">
      <div className="tone-emerald grain absolute inset-0 -z-10" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest/80 via-forest/30 to-transparent" aria-hidden="true" />

      <div className="container-luxe grid min-h-[100svh] items-center gap-10 pt-36 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:pt-44 lg:pb-24">
        <div className="max-w-2xl">
          <p className="eyebrow animate-fade-up text-gold">Your scent. Your signature.</p>
          <h1 id="hero-title" className="display animate-fade-up mt-6 text-[3.4rem] text-ivory [animation-delay:120ms] sm:text-7xl lg:text-[6.2rem]">
            Find your <em className="text-gold">signature</em> scent.
          </h1>
          <p className="animate-fade-up mt-7 max-w-md text-base leading-relaxed text-ivory/75 [animation-delay:240ms] md:text-lg">
            Discover exceptional fragrances from the world&rsquo;s most loved perfume houses, all in one place.
          </p>
          <div className="animate-fade-up mt-10 flex flex-col gap-3 [animation-delay:360ms] sm:flex-row">
            <Link href="/shop" className="btn btn-gold">Shop collection</Link>
            <Link href="/collections/arabic" className="btn btn-outline-light">Explore Arabic perfumes</Link>
          </div>
        </div>

        {/* Campaign frame — the arch echoes a boutique display niche. */}
        <div className="relative mx-auto hidden w-full max-w-md lg:block" aria-hidden="true">
          <div className="relative aspect-[3/4] overflow-hidden rounded-t-full border border-gold/25">
            <EditorialImage slot="hero" sizes="28rem" priority className="absolute inset-0" />
            <div className="absolute inset-3 rounded-t-full border border-gold/15" />
            {/* Until the campaign photograph arrives, the arch holds the brand monogram. */}
            {!media.hero.src && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Monogram className="h-[38%] opacity-95 drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)]" />
              </div>
            )}
          </div>
          <p className="eyebrow mt-5 text-center text-[0.6rem] text-ivory/50">Homies Choice · Ahmedabad</p>
        </div>
      </div>
    </section>
  );
}
