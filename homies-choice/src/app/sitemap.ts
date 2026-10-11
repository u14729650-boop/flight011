import type { MetadataRoute } from "next";
import { collections } from "@/data/collections";
import { policies } from "@/data/policies";
import { getCatalogue } from "@/lib/server/catalogue-source";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCatalogue();
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/shop"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/watches"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...collections.map((c) => ({ url: absoluteUrl(`/collections/${c.slug}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: absoluteUrl(`/products/${p.slug}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...policies.map((p) => ({ url: absoluteUrl(`/policies/${p.slug}`), lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
