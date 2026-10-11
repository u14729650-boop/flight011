import Link from "next/link";
import { media } from "@/data/media";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { Monogram } from "@/components/ui/Logo";

export function Hero() {
  const hero = media.hero;
  return (
    <section className="on-dark relative isolate overflow-hidden bg-forest text-ivory" aria-labelledby="hero-title">
      <EditorialImage slot="hero" priority className="absolute inset-0 -z-10" imageClassName="scale-105" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest via-forest/75 to-forest/10" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-forest/80 to-transparent" aria-hidden="true" />

      <div className="container-luxe grid min-h-[100svh] items-center gap-12 pt-36 pb-20 lg:grid-cols-[1.15fr_0.85fr] lg:pt-44 lg:pb-24">
        <div className="max-w-2xl">
          <p className="eyebrow animate-fade-up flex items-center gap-4 text-gold">
            <span className="h-px w-10 bg-gold/70" aria-hidden="true" />
            Your scent. Your signature.
          </p>
          <h1 id="hero-title" className="display animate-fade-up mt-7 text-[3.4rem] text-ivory [animation-delay:120ms] sm:text-7xl lg:text-[6.4rem]">
            Find your <em className="text-gold">signature</em> scent.
          </h1>
          <p className="animate-fade-up mt-8 max-w-md text-base leading-relaxed text-ivory/75 [animation-delay:240ms] md:text-lg">
            Discover exceptional fragrances from the world&rsquo;s most loved perfume houses, all in one place.
          </p>
          <div className="animate-fade-up mt-11 flex flex-col gap-3 [animation-delay:360ms] sm:flex-row">
            <Link href="/shop" className="btn btn-gold">Shop collection</Link>
            <Link href="/collections/arabic" className="btn btn-outline-light">Explore Arabic perfumes</Link>
          </div>
        </div>

        {/* Boutique niche: an arch framing the monogram, or the campaign photograph once supplied. */}
        <div className="relative mx-auto hidden w-full max-w-[25rem] lg:block" aria-hidden="true">
          <div className="relative aspect-[3/4] overflow-hidden rounded-t-full border border-gold/35 bg-forest/30 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-[2px]">
            {!hero.art && hero.src && <EditorialImage slot="hero" sizes="25rem" className="absolute inset-0" />}
            <div className="absolute inset-3 rounded-t-full border border-gold/15" />
            {hero.art && (
              <>
                <div className="absolute top-1/2 left-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(213,180,119,0.18),transparent_65%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Monogram className="h-[40%] drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]" />
                </div>
              </>
            )}
          </div>
          <div className="mt-6 flex items-center justify-center gap-3 text-ivory/55">
            <span className="h-px w-8 bg-gold/40" />
            <p className="eyebrow text-[0.58rem]">Paldi · Ahmedabad</p>
            <span className="h-px w-8 bg-gold/40" />
          </div>
        </div>
      </div>
    </section>
  );
}
