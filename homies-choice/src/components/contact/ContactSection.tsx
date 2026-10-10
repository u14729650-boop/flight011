import { ArrowUpRight, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { CopyButton } from "@/components/ui/CopyButton";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ContactForm } from "./ContactForm";

export function ContactSection({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const H = headingLevel;
  return (
    <section className="grid lg:grid-cols-2" aria-labelledby="contact-title">
      <div className="on-dark bg-emerald text-ivory">
        <div className="mx-auto max-w-xl px-5 py-20 md:px-10 md:py-28 lg:ml-auto lg:mr-0 lg:pr-16">
          <p className="eyebrow text-gold">Visit · Call · Chat</p>
          <H id="contact-title" className="display mt-5 text-[2.6rem] sm:text-5xl lg:text-[3.6rem]">
            Let&rsquo;s find your next <em className="text-gold">favourite</em> fragrance.
          </H>
          <p className="mt-6 max-w-md text-ivory/70">
            Message us on WhatsApp for prices, availability or a personal recommendation.
          </p>

          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-10">
            <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
          </a>

          <dl className="mt-12 space-y-8 border-t border-ivory/15 pt-10">
            <div>
              <dt className="eyebrow text-[0.6rem] text-ivory/55">WhatsApp &amp; phone</dt>
              <dd className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                <a href={`tel:+${siteConfig.whatsapp.number}`} className="font-serif text-3xl hover:text-gold">
                  {siteConfig.whatsapp.display}
                </a>
                <CopyButton value={siteConfig.whatsapp.display} label="Copy number" className="text-gold hover:text-ivory" />
              </dd>
              <dd className="mt-1 text-sm text-ivory/60">Ask for {siteConfig.owner}</dd>
            </div>
            <div>
              <dt className="eyebrow text-[0.6rem] text-ivory/55">Store</dt>
              <dd className="mt-2 flex gap-3 text-lg leading-snug">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold" strokeWidth={1.4} aria-hidden="true" />
                <address className="not-italic">
                  {siteConfig.name}
                  <br />
                  {siteConfig.address.lines.join(", ")},
                  <br />
                  {siteConfig.address.locality}, {siteConfig.address.region}, {siteConfig.address.country}
                </address>
              </dd>
              <dd className="mt-4 pl-7">
                <a
                  href={siteConfig.address.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-gold uppercase hover:text-ivory"
                >
                  Find us on Google Maps <ArrowUpRight className="h-3.5 w-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-ivory">
        <div className="mx-auto max-w-xl px-5 py-20 md:px-10 md:py-28 lg:mr-auto lg:ml-0 lg:pl-16">
          <p className="eyebrow text-gold-deep">Send an enquiry</p>
          <p className="display mt-5 text-4xl">How can we help?</p>
          <div className="mt-10">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
