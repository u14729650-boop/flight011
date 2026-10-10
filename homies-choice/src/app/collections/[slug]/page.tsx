import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { collections, getCollection } from "@/data/collections";
import { Catalogue } from "@/components/catalogue/Catalogue";
import { CatalogueFallback } from "@/components/catalogue/CatalogueFallback";
import { PageIntro } from "@/components/ui/PageIntro";

export const dynamicParams = false;

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) return {};
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: `/collections/${c.slug}` },
    openGraph: { title: `${c.title} | HOMIES CHOICE`, description: c.metaDescription, url: `/collections/${c.slug}` },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) notFound();
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: c.title }]}
        eyebrow={c.eyebrow}
        title={c.title}
        intro={c.intro}
        media={c.media}
      />
      <Suspense fallback={<CatalogueFallback />}>
        <Catalogue scope={c.scope} />
      </Suspense>
    </>
  );
}
