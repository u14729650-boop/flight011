import { ArrowUpRight, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { CopyButton } from "@/components/ui/CopyButton";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ContactForm } from "./ContactForm";

export function ContactSection({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const H = headingLevel;
  return (
    <section className="on-dark relative isolate overflow-hidden rounded-b-[2.5rem] bg-forest text-ivory" aria-labelledby="contact-title">
      <EditorialImage slot="mood-elegant-sophisticated" sizes="100vw" className="absolute inset-0 -z-10 opacity-70" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-forest/90 via-forest/60 to-forest/90" aria-hidden="true" />
      <div className="orb orb-gold -z-10 h-[30rem] w-[30rem] top-10 right-[20%] opacity-35" aria-hidden="true" />

      <div className="container-luxe grid gap-4 py-16 sm:gap-6 md:py-28 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
        <div className="glass rounded-[1.75rem] p-6 sm:p-8 md:rounded-[2rem] md:p-12" data-reveal>
          <p className="eyebrow text-gold">Visit · Call · Chat</p>
          <H id="contact-title" className="display mt-5 text-[2.5rem] sm:text-5xl lg:text-[3.4rem]">
            Let&rsquo;s find your next <em className="text-gold italic">favourite</em> fragrance.
          </H>
          <p className="mt-6 max-w-md font-light text-ivory/75">
            Message us on WhatsApp for prices, availability or a personal recommendation.
          </p>

          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-9">
            <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
          </a>

          <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-[1.25rem] border border-ivory/10 bg-ivory/[0.05] p-4 sm:p-5">
              <dt className="eyebrow text-[0.58rem] text-ivory/55">WhatsApp &amp; phone</dt>
              <dd className="mt-2">
                <a href={`tel:+${siteConfig.whatsapp.number}`} className="text-2xl font-light tracking-wide tabular-nums hover:text-gold">
                  {siteConfig.whatsapp.display}
                </a>
              </dd>
              <dd className="mt-1 text-sm text-ivory/60">Ask for {siteConfig.owner}</dd>
              <dd className="mt-3">
                <CopyButton value={siteConfig.whatsapp.display} label="Copy number" className="rounded-full border border-gold/30 px-3 py-1.5 text-gold hover:bg-gold hover:text-forest" />
              </dd>
            </div>
            <div className="rounded-[1.25rem] border border-ivory/10 bg-ivory/[0.05] p-4 sm:p-5">
              <dt className="eyebrow text-[0.58rem] text-ivory/55">Store</dt>
              <dd className="mt-2 flex gap-2.5 leading-snug">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold" strokeWidth={1.4} aria-hidden="true" />
                <address className="not-italic">
                  {siteConfig.name}
                  <br />
                  {siteConfig.address.lines.join(", ")},
                  <br />
                  {siteConfig.address.locality}, {siteConfig.address.region}, {siteConfig.address.country}
                </address>
              </dd>
              <dd className="mt-3">
                <a
                  href={siteConfig.address.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1.5 text-xs font-medium tracking-[0.12em] text-gold uppercase transition-colors hover:bg-gold hover:text-forest"
                >
                  Open in Maps <ArrowUpRight className="h-3.5 w-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="glass-light rounded-[1.75rem] !bg-ivory/[0.94] p-6 text-charcoal sm:p-8 md:rounded-[2rem] md:p-12" data-reveal data-reveal-delay="150">
          <p className="eyebrow text-gold-deep">Send an enquiry</p>
          <p className="display mt-5 text-4xl">How can we help?</p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
