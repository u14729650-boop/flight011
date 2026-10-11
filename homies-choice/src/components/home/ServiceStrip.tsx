import { MapPin, MessageCircle, Sparkles } from "lucide-react";
import type { StoreSettings } from "@/lib/store-settings";
import { whatsappFor } from "@/lib/whatsapp";

/** Floating glass bar that bridges the hero and the ivory page. */
export function ServiceStrip({ settings }: { settings: StoreSettings }) {
  const b = settings.business;
  const items = [
    { icon: MessageCircle, title: "Order on WhatsApp", body: `Chat with us on ${b.whatsapp}`, href: whatsappFor(settings)(), external: true },
    { icon: MapPin, title: `Visit us in ${b.area}`, body: [b.addressLine2 || b.addressLine1, b.locality].join(", "), href: b.mapsUrl, external: true },
    { icon: Sparkles, title: "Personal guidance", body: "Tell us what you love — we'll suggest what's next", href: "/contact", external: false },
  ];
  return (
    <section aria-label="How we help" className="relative z-10 -mt-14 px-4 md:-mt-16">
      <ul className="glass-light container-luxe grid max-w-6xl !bg-white/80 divide-y divide-charcoal/[0.07] rounded-[1.75rem] !px-2 md:grid-cols-3 md:divide-x md:divide-y-0" data-reveal>
        {items.map(({ icon: Icon, title, body, href, external }) => (
          <li key={title}>
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group flex items-center gap-4 rounded-[1.4rem] px-5 py-5 transition-colors hover:bg-white/60 md:justify-center"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald text-gold shadow-[0_8px_20px_-10px_rgba(6,59,46,0.8)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span>
                <span className="eyebrow block text-[0.62rem] text-charcoal">{title}</span>
                <span className="mt-1 block text-[0.8rem] text-stone">{body}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
