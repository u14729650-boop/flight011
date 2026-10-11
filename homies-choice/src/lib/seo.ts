import { siteConfig } from "@/config/site";
import { productTitle, type Product } from "@/data/products";
import { addressLines, defaultSettings, whatsappDigits, type StoreSettings } from "./store-settings";

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function storeJsonLd(settings: StoreSettings = defaultSettings) {
  const b = settings.business;
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": absoluteUrl("/#store"),
    name: siteConfig.name,
    description: settings.seo.description,
    url: absoluteUrl("/"),
    telephone: `+${whatsappDigits(b.phone ?? b.whatsapp)}`,
    founder: { "@type": "Person", name: b.owner },
    ...(b.email ? { email: b.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: addressLines(b)[0],
      addressLocality: b.locality,
      addressRegion: b.region,
      ...(b.postalCode ? { postalCode: b.postalCode } : {}),
      addressCountry: siteConfig.address.countryCode,
    },
    hasMap: b.mapsUrl,
    ...(b.instagram ? { sameAs: [b.instagram] } : {}),
  };
}

/** Product structured data — offers only when a confirmed price exists; never ratings. */
export function productJsonLd(product: Product) {
  const priced = product.variants.filter((v) => v.price != null);
  const availability = {
    in_stock: "https://schema.org/InStock",
    low_stock: "https://schema.org/LimitedAvailability",
    out_of_stock: "https://schema.org/OutOfStock",
    on_request: null,
  } as const;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productTitle(product),
    brand: { "@type": "Brand", name: product.brand },
    description: product.description,
    category: "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne",
    url: absoluteUrl(`/products/${product.slug}`),
    ...(product.images.length ? { image: product.images.map((i) => absoluteUrl(i.src)) } : {}),
    ...(priced.length
      ? {
          offers: priced.map((v) => ({
            "@type": "Offer",
            sku: v.id,
            price: v.price,
            priceCurrency: siteConfig.currency,
            ...(availability[v.availability] ? { availability: availability[v.availability] } : {}),
            url: absoluteUrl(`/products/${product.slug}`),
            seller: { "@id": absoluteUrl("/#store") },
            ...(v.sizeMl ? { name: `${productTitle(product)} ${v.sizeMl} ml` } : {}),
          })),
        }
      : {}),
  };
}
