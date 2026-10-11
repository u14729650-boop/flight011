import { MapPin, MessageCircle, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";

const items = [
  { icon: MessageCircle, title: "Order on WhatsApp", body: `Chat with us on ${siteConfig.whatsapp.display}`, href: whatsappUrl(), external: true },
  { icon: MapPin, title: "Visit us in Paldi", body: "Near Banas Flat, Ahmedabad", href: siteConfig.address.mapsUrl, external: true },
  { icon: Sparkles, title: "Personal guidance", body: "Tell us what you love — we'll suggest what's next", href: "/contact", external: false },
];

export function ServiceStrip() {
  return (
    <section aria-label="How we help" className="on-dark border-t border-gold/15 bg-forest text-ivory">
      <ul className="container-luxe grid divide-y divide-ivory/10 md:grid-cols-3 md:divide-x md:divide-y-0">
        {items.map(({ icon: Icon, title, body, href, external }) => (
          <li key={title}>
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group flex items-center gap-4 py-6 md:justify-center md:px-6"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/35 text-gold transition-colors group-hover:bg-gold group-hover:text-forest">
                <Icon className="h-4 w-4" strokeWidth={1.4} aria-hidden="true" />
              </span>
              <span>
                <span className="eyebrow block text-[0.62rem] text-ivory">{title}</span>
                <span className="mt-1 block text-xs text-ivory/60">{body}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
