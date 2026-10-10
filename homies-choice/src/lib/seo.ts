import { siteConfig } from "@/config/site";
import { productTitle, type Product } from "@/data/products";

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function storeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": absoluteUrl("/#store"),
    name: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    telephone: `+${siteConfig.whatsapp.number}`,
    founder: { "@type": "Person", name: siteConfig.owner },
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.lines.join(", "),
      addressLocality: siteConfig.address.locality,
      addressRegion: siteConfig.address.region,
      addressCountry: siteConfig.address.countryCode,
    },
    ...(siteConfig.instagram ? { sameAs: [siteConfig.instagram] } : {}),
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
