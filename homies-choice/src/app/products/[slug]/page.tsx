import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products, productTitle } from "@/data/products";
import { fragranceFamilies, genderLabels, originLabels } from "@/data/taxonomy";
import { productJsonLd } from "@/lib/seo";
import { sizesLine } from "@/lib/product-meta";
import { Gallery } from "@/components/product/Gallery";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/ui/JsonLd";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  const title = productTitle(p);
  const description = `${title}${p.concentration ? ` ${p.concentration}` : ""} — ${p.origin === "arabic" ? "Arabic perfume" : "designer fragrance"} available at Homies Choice, Ahmedabad. ${p.description}`.slice(0, 300);
  return {
    title: `${title}${p.concentration ? ` ${p.concentration}` : ""}`,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      type: "website",
      title: `${title} | HOMIES CHOICE`,
      description,
      url: `/products/${p.slug}`,
      ...(p.images[0] ? { images: [{ url: p.images[0].src, width: p.images[0].width, height: p.images[0].height, alt: p.images[0].alt }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = products
    .filter((p) => p.slug !== product.slug)
    .map((p) => ({
      p,
      score:
        p.families.filter((f) => product.families.includes(f)).length * 2 +
        (p.gender === product.gender ? 1 : 0) +
        (p.origin === product.origin ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((r) => r.p);

  const details: { label: string; value: string }[] = [
    { label: "Brand", value: product.brand },
    ...(product.concentration ? [{ label: "Concentration", value: product.concentration }] : []),
    { label: "For", value: genderLabels[product.gender] },
    { label: "Type", value: product.origin === "arabic" ? "Arabic perfume" : "Designer fragrance" },
    ...(product.families.length ? [{ label: "Fragrance family", value: product.families.map((f) => fragranceFamilies[f]).join(", ") }] : []),
    { label: "Sizes", value: sizesLine(product) },
  ];

  return (
    <>
      <div className="container-luxe pt-6 pb-20 md:pt-10">
        <nav aria-label="Breadcrumb" className="text-xs text-stone">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-charcoal">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href={`/collections/${product.origin}`} className="hover:text-charcoal">{originLabels[product.origin]} fragrances</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-charcoal">{productTitle(product)}</li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <Gallery product={product} />

          <div className="lg:sticky lg:top-[11rem] lg:self-start">
            <p className="eyebrow text-gold-deep">{product.brand}</p>
            <h1 className="display mt-3 text-5xl md:text-6xl">{product.name}</h1>
            <p className="mt-3 text-sm text-stone">
              {[product.concentration, genderLabels[product.gender], originLabels[product.origin]].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-6 leading-relaxed text-charcoal/80">{product.description}</p>

            <div className="mt-8">
              <PurchasePanel product={product} />
            </div>

            {product.notes && (
              <section className="mt-12" aria-labelledby="notes-title">
                <h2 id="notes-title" className="eyebrow text-charcoal">Fragrance notes</h2>
                <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-5 text-sm">
                  {(["top", "heart", "base"] as const).map((tier) => (
                    <div key={tier}>
                      <dt className="eyebrow text-[0.6rem] text-gold-deep">{tier}</dt>
                      <dd className="mt-2 text-charcoal/80">{product.notes![tier].join(", ")}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section className="mt-12" aria-labelledby="details-title">
              <h2 id="details-title" className="eyebrow text-charcoal">Details</h2>
              <dl className="mt-5 divide-y divide-line border-y border-line text-sm">
                {details.map((d) => (
                  <div key={d.label} className="flex justify-between gap-6 py-3">
                    <dt className="text-stone">{d.label}</dt>
                    <dd className="text-right">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-[#f1ebdf] py-20" aria-labelledby="related-title">
          <div className="container-luxe">
            <p className="eyebrow text-gold-deep">You may also like</p>
            <h2 id="related-title" className="display mt-4 text-4xl md:text-5xl">Related fragrances</h2>
            <ul className="mt-12 grid grid-cols-1 gap-x-4 gap-y-12 min-[360px]:grid-cols-2 md:gap-x-5 lg:grid-cols-4 lg:gap-x-7">
              {related.map((p) => (
                <li key={p.slug} className="flex">
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <JsonLd data={productJsonLd(product)} />
    </>
  );
}
