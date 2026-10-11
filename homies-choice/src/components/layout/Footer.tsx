import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { addressLines, type StoreSettings } from "@/lib/store-settings";
import { whatsappFor } from "@/lib/whatsapp";
import { Logo } from "@/components/ui/Logo";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";

const shopLinks = [
  { label: "Shop All", href: "/shop" },
  { label: "Men's Fragrances", href: "/collections/men" },
  { label: "Women's Fragrances", href: "/collections/women" },
  { label: "Unisex", href: "/collections/unisex" },
  { label: "Arabic Perfumes", href: "/collections/arabic" },
  { label: "Designer Fragrances", href: "/collections/designer" },
  { label: "Watches", href: "/watches" },
  { label: "Bestsellers", href: "/collections/bestsellers" },
];

const policyLinks = [
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms & Conditions", href: "/policies/terms" },
  { label: "Shipping Policy", href: "/policies/shipping" },
  { label: "Returns & Refunds", href: "/policies/returns" },
];

export function Footer({ settings }: { settings: StoreSettings }) {
  const year = new Date().getFullYear();
  const b = settings.business;
  const wa = whatsappFor(settings);
  const [street, city] = addressLines(b);
  return (
    <footer className="on-dark relative isolate mt-6 overflow-hidden rounded-t-[2.5rem] bg-forest text-ivory">
      <div className="orb orb-emerald h-[30rem] w-[30rem] -top-40 left-[10%]" aria-hidden="true" />
      <div className="orb orb-gold h-[22rem] w-[22rem] -right-20 bottom-0 opacity-25" aria-hidden="true" />
      <div className="container-luxe grid gap-12 py-16 md:grid-cols-2 md:py-20 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Link href="/" aria-label={`${siteConfig.name} — home`} className="inline-block">
            <Logo />
          </Link>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory/65">{b.footerBlurb}</p>
          <div className="mt-6 flex gap-2">
            <a
              href={wa()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-ivory/[0.04] text-gold transition-all hover:-translate-y-0.5 hover:bg-gold hover:text-forest"
              aria-label="WhatsApp (opens in a new tab)"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
            {b.instagram && (
              <a
                href={b.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-ivory/[0.04] text-gold transition-all hover:-translate-y-0.5 hover:bg-gold hover:text-forest"
                aria-label="Instagram (opens in a new tab)"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <nav aria-label="Shop">
          <h2 className="eyebrow text-gold">Shop</h2>
          <ul className="mt-5 space-y-3 text-sm text-ivory/75">
            {shopLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-gold">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Customer care">
          <h2 className="eyebrow text-gold">Customer care</h2>
          <ul className="mt-5 space-y-3 text-sm text-ivory/75">
            <li><Link href="/contact" className="hover:text-gold">Contact us</Link></li>
            {policyLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-gold">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow text-gold">Visit &amp; contact</h2>
          <address className="mt-5 space-y-4 text-sm leading-relaxed text-ivory/75 not-italic">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.4} aria-hidden="true" />
              <a href={b.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                {street},<br />
                {city}, India
              </a>
            </p>
            <p className="flex gap-3">
              <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <a href={wa()} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                {b.whatsapp}
              </a>
            </p>
            {b.phone && (
              <p className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.4} aria-hidden="true" />
                <a href={`tel:+${b.phone.replace(/\D/g, "")}`} className="hover:text-gold">{b.phone}</a>
              </p>
            )}
            {b.email && (
              <p className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.4} aria-hidden="true" />
                <a href={`mailto:${b.email}`} className="break-all hover:text-gold">{b.email}</a>
              </p>
            )}
            {b.hours && (
              <p className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.4} aria-hidden="true" />
                <span>{b.hours}</span>
              </p>
            )}
            <p className="text-ivory/55">Contact: {b.owner}</p>
          </address>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-luxe flex flex-col gap-2 py-6 text-xs text-ivory/50 md:flex-row md:items-center md:justify-between">
          <p>© {year} {siteConfig.name}. All rights reserved.</p>
          <p>Brand names and trademarks belong to their respective owners.</p>
        </div>
      </div>
    </footer>
  );
}
