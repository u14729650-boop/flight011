import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EditorialImage } from "@/components/ui/EditorialImage";

export function WatchesTeaser() {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-charcoal text-ivory" aria-labelledby="watches-teaser-title">
      <div className="grid lg:grid-cols-2">
        <EditorialImage slot="watchesTile" sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/3] w-full lg:aspect-auto lg:min-h-[34rem]" />
        <div className="flex items-center">
          <div className="max-w-xl px-5 py-16 md:px-10 lg:px-16 lg:py-24">
            <p className="eyebrow text-gold">New at Homies Choice</p>
            <h2 id="watches-teaser-title" className="display mt-5 text-[2.6rem] text-balance sm:text-5xl lg:text-[3.6rem]">
              Watches, chosen with the <em className="text-gold">same care.</em>
            </h2>
            <p className="mt-6 leading-relaxed text-ivory/70">
              A considered edit of timepieces to wear with your signature scent — for everyday, for occasions, and for gifting.
            </p>
            <Link href="/watches" className="btn btn-gold mt-10">
              Discover watches <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
