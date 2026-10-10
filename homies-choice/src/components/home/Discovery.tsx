import Link from "next/link";
import { EditorialImage } from "@/components/ui/EditorialImage";

export function Discovery() {
  return (
    <section className="container-luxe grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2 lg:gap-20" aria-labelledby="discovery-title">
      <EditorialImage slot="discovery" sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/5] w-full lg:aspect-[5/6]" />
      <div className="max-w-xl">
        <p className="eyebrow text-gold-deep">The Homies Choice way</p>
        <h2 id="discovery-title" className="display mt-5 text-[2.6rem] sm:text-5xl lg:text-[3.8rem]">
          Not just a perfume. <em className="text-emerald">Your personal signature.</em>
        </h2>
        <div className="mt-8 space-y-5 text-[1rem] leading-relaxed text-stone">
          <p className="font-serif text-2xl leading-snug text-charcoal italic">
            Some fragrances make an entrance. Others leave a lasting impression.
          </p>
          <p>
            At Homies Choice, discover scents that complement your personality — from bold, sophisticated designer
            fragrances to rich, captivating Arabic compositions.
          </p>
          <p>Find the fragrance that feels unmistakably yours.</p>
        </div>
        <Link href="/shop" className="btn btn-dark mt-10">Explore the collection</Link>
      </div>
    </section>
  );
}
