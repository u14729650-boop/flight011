import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { productTitle, type Product } from "@/data/products";
import { media } from "@/data/media";
import { variantLabel } from "@/lib/format";
import type { CallToAction, StoreSettings } from "@/lib/store-settings";
import { whatsappFor } from "@/lib/whatsapp";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { HeroBackdrop, HeroMobileSpacer, HeroPicture } from "@/components/ui/HeroPicture";
import { Monogram } from "@/components/ui/Logo";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Bottle3D } from "./bottle/Bottle3D";

function CtaLink({ cta, className }: { cta: CallToAction; className: string }) {
  return cta.href.startsWith("/") ? (
    <Link href={cta.href} className={className}>{cta.label}</Link>
  ) : (
    <a href={cta.href} target="_blank" rel="noopener noreferrer" className={className}>{cta.label}</a>
  );
}

export function Hero({ products, settings }: { products: Product[]; settings: StoreSettings }) {
  const { hero } = settings.home;
  const bottle = hero.visual === "bottle";
  const featured = products.find((p) => p.bestseller && p.category === "fragrance") ?? products[0];
  const fragrances = products.filter((p) => p.category === "fragrance").length;
  const houses = new Set(products.map((p) => p.brand)).size;
  const wa = whatsappFor(settings);

  const floatingCards = (
    <>
      {featured && (
        <Link
          href={`/products/${featured.slug}`}
          className="glass animate-float group absolute -bottom-6 -left-16 z-10 w-64 rounded-[1.5rem] p-5 transition-colors hover:bg-ivory/10"
        >
          <p className="eyebrow text-[0.55rem] text-gold">Bestseller</p>
          <p className="mt-2 font-serif text-2xl leading-tight">{productTitle(featured)}</p>
          <p className="mt-1 text-xs text-ivory/65">
            {[featured.concentration, variantLabel(featured.variants[0], featured.category)].filter(Boolean).join(" · ")}
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-[0.65rem] font-medium tracking-[0.14em] text-ivory uppercase">
            Discover <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </Link>
      )}
      <a
        href={wa("Hello Homies Choice, I'd like a fragrance recommendation.")}
        target="_blank"
        rel="noopener noreferrer"
        className="glass animate-float-slow absolute top-16 -right-10 z-10 flex items-center gap-3 rounded-full py-2.5 pr-5 pl-2.5 transition-colors hover:bg-ivory/10"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-forest">
          <WhatsAppIcon className="h-4 w-4" />
        </span>
        <span className="leading-tight">
          <span className="block text-[0.7rem] font-medium tracking-[0.08em] uppercase">Ask for advice</span>
          <span className="block text-[0.7rem] text-ivory/60">Chat on WhatsApp</span>
        </span>
        <span className="sr-only">(opens WhatsApp)</span>
      </a>
    </>
  );

  return (
    <section className="on-dark relative isolate overflow-hidden bg-forest text-ivory" aria-labelledby="hero-title">
      {bottle ? <HeroBackdrop className="absolute inset-0 -z-10" /> : <HeroPicture className="absolute inset-0 -z-10" />}
      {/* Phones: text sits low over a darkening fade; desktop: fade from the left. */}
      <div
        className={
          bottle
            ? "absolute inset-0 -z-10 bg-gradient-to-r from-forest via-forest/80 to-forest/30 max-lg:hidden"
            : "absolute inset-0 -z-10 bg-gradient-to-r from-forest via-forest/70 to-forest/5 portrait:max-lg:hidden"
        }
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-forest/90 to-transparent" aria-hidden="true" />
      <div className="orb orb-gold -z-10 h-[28rem] w-[28rem] top-36 right-[8%] opacity-40" aria-hidden="true" />

      <div
        className={
          bottle
            ? "container-luxe grid items-center gap-4 pt-24 pb-24 lg:min-h-[100svh] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-44"
            : "container-luxe grid min-h-[100svh] items-center gap-14 pt-36 pb-24 portrait:max-lg:min-h-0 portrait:max-lg:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:pt-44"
        }
      >
        <div className="order-2 max-w-2xl lg:order-1">
          {!bottle && <HeroMobileSpacer />}
          <p className="eyebrow animate-fade-up inline-flex items-center gap-3 rounded-full border border-ivory/15 bg-ivory/[0.06] px-4 py-2 text-gold backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
            {hero.eyebrow}
          </p>
          <h1 id="hero-title" className="display animate-fade-up mt-7 text-[3.1rem] text-ivory [animation-delay:120ms] sm:text-7xl lg:mt-8 lg:text-[6rem]">
            {hero.titleStart && <>{hero.titleStart} </>}
            <em className="font-normal text-gold italic">{hero.titleAccent}</em>
            {hero.titleEnd && <> {hero.titleEnd}</>}
          </h1>
          <p className="animate-fade-up mt-6 max-w-md text-[1.05rem] leading-relaxed font-light text-ivory/75 [animation-delay:240ms] md:mt-8 md:text-lg">
            {hero.subtitle}
          </p>
          <div className="animate-fade-up mt-9 flex flex-col gap-3 [animation-delay:360ms] sm:flex-row md:mt-11">
            <CtaLink cta={hero.primary} className="btn btn-gold" />
            {hero.secondary.label && <CtaLink cta={hero.secondary} className="btn btn-outline-light" />}
          </div>

          {hero.showStats && (
            <dl className="glass animate-fade-up mt-14 hidden max-w-lg grid-cols-3 divide-x divide-ivory/10 rounded-[1.25rem] [animation-delay:480ms] sm:grid">
              {[
                { k: "Fragrances", v: fragrances },
                { k: "Perfume houses", v: houses },
                { k: settings.business.locality, v: settings.business.area },
              ].map((s) => (
                <div key={s.k} className="flex flex-col-reverse px-5 py-4">
                  <dt className="eyebrow mt-2 text-[0.55rem] text-ivory/60">{s.k}</dt>
                  <dd className="font-serif text-3xl leading-none text-ivory">{s.v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {bottle ? (
          // The flacon stands in a glass arch; its gold rings pass in front of the frame.
          <div className="relative order-1 mx-auto w-[min(80vw,21rem)] sm:w-[min(60vw,24rem)] lg:order-2 lg:w-full lg:max-w-[30rem]">
            <div className="relative aspect-[4/5]">
              <div className="glass-dark animate-fade-up absolute inset-x-[15%] top-[5%] bottom-[7%] rounded-t-full rounded-b-[2rem] [animation-delay:150ms]" aria-hidden="true">
                <div className="absolute inset-2.5 rounded-t-full rounded-b-[1.6rem] border border-gold/20" />
                <div className="absolute top-[38%] left-1/2 h-[70%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(21,120,90,0.45),transparent_62%)]" />
              </div>
              <Bottle3D liquid={hero.liquid} priority className="absolute inset-0" />
            </div>
            <div className="hidden lg:block">{floatingCards}</div>
          </div>
        ) : (
          // Boutique niche: a glass arch holding the monogram (or the campaign photograph once supplied).
          <div className="relative order-2 mx-auto hidden w-full max-w-[26rem] lg:block">
            <div className="glass-dark animate-fade-up relative aspect-[3/4] overflow-hidden rounded-t-full rounded-b-[2rem] [animation-delay:200ms]" aria-hidden="true">
              {!media.hero.art && media.hero.src && <EditorialImage slot="hero" sizes="26rem" className="absolute inset-0" />}
              <div className="absolute inset-3 rounded-t-full rounded-b-[1.6rem] border border-gold/20" />
              {media.hero.art && (
                <>
                  <div className="absolute top-1/2 left-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(213,180,119,0.22),transparent_65%)]" />
                  <div className="animate-float-slow absolute inset-0 flex items-center justify-center">
                    <Monogram className="h-[38%] drop-shadow-[0_24px_40px_rgba(0,0,0,0.55)]" />
                  </div>
                </>
              )}
            </div>
            {floatingCards}
          </div>
        )}
      </div>
    </section>
  );
}
