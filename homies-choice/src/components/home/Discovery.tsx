import Link from "next/link";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { Monogram } from "@/components/ui/Logo";

export function Discovery() {
  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="discovery-title">
      <div className="orb orb-gold h-[28rem] w-[28rem] top-1/3 left-[30%] opacity-40" aria-hidden="true" />
      <div className="container-luxe grid items-center gap-14 py-20 md:py-28 lg:grid-cols-2 lg:gap-20">
        <div className="relative" data-reveal="zoom">
          <EditorialImage slot="discovery" sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/5] w-full rounded-[2rem] lg:aspect-[5/6]" />
          <figure className="glass-light animate-float absolute right-4 -bottom-8 max-w-[18rem] rounded-[1.5rem] p-6 md:-right-10 md:bottom-10">
            <Monogram className="h-8" />
            <blockquote className="mt-4 font-serif text-xl leading-snug text-charcoal italic">
              &ldquo;Some fragrances make an entrance. Others leave a lasting impression.&rdquo;
            </blockquote>
          </figure>
        </div>
        <div className="max-w-xl" data-reveal data-reveal-delay="150">
          <p className="eyebrow text-gold-deep">The Homies Choice way</p>
          <h2 id="discovery-title" className="display mt-5 text-[2.6rem] sm:text-5xl lg:text-[3.6rem]">
            Not just a perfume. <em className="text-emerald italic">Your personal signature.</em>
          </h2>
          <div className="mt-8 space-y-5 text-[1.02rem] leading-relaxed font-light text-stone">
            <p>
              At Homies Choice, discover scents that complement your personality — from bold, sophisticated designer
              fragrances to rich, captivating Arabic compositions.
            </p>
            <p>Find the fragrance that feels unmistakably yours.</p>
          </div>
          <Link href="/shop" className="btn btn-dark mt-10">Explore the collection</Link>
        </div>
      </div>
    </section>
  );
}
