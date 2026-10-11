import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EditorialImage } from "@/components/ui/EditorialImage";

export function WatchesTeaser() {
  return (
    <section className="container-luxe py-6 md:py-10" aria-labelledby="watches-teaser-title">
      <div className="on-dark relative isolate overflow-hidden rounded-[2.25rem] bg-charcoal text-ivory" data-reveal="zoom">
        <EditorialImage slot="watchesTile" sizes="100vw" className="absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0d0f0c]/10 via-[#0d0f0c]/30 to-[#0d0f0c]/85" aria-hidden="true" />
        <div className="flex min-h-[32rem] items-center justify-end p-4 md:p-10">
          <div className="glass max-w-lg rounded-[1.75rem] p-8 md:p-10">
            <p className="eyebrow text-gold">New at Homies Choice</p>
            <h2 id="watches-teaser-title" className="display mt-5 text-[2.4rem] sm:text-5xl">
              Watches, chosen with the <em className="text-gold italic">same care.</em>
            </h2>
            <p className="mt-6 leading-relaxed font-light text-ivory/75">
              A considered edit of timepieces to wear with your signature scent — for everyday, for occasions, and for gifting.
            </p>
            <Link href="/watches" className="btn btn-gold mt-9">
              Discover watches <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
