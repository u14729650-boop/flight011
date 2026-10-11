import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPolicy, policies } from "@/data/policies";
import { getSettings } from "@/lib/server/settings";
import { PageIntro } from "@/components/ui/PageIntro";

export const dynamicParams = false;

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPolicy(slug);
  return p ? { title: p.title, alternates: { canonical: `/policies/${p.slug}` } } : {};
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = getPolicy(slug, await getSettings());
  if (!policy) notFound();
  return (
    <>
      <PageIntro crumbs={[{ label: "Home", href: "/" }, { label: policy.title }]} eyebrow="Customer care" title={policy.title} />
      <article className="container-luxe max-w-3xl py-16 md:py-20">
        {policy.updated && <p className="text-xs text-stone">Last updated {policy.updated}</p>}
        <div className="space-y-5 text-[1.02rem] leading-relaxed text-charcoal/85">
          {policy.body.map((para, i) => (
            <p key={i} className="whitespace-pre-line">{para}</p>
          ))}
        </div>
      </article>
    </>
  );
}
