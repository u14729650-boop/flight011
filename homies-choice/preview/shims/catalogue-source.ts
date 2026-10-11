import { getStore } from "./demo-store";

export async function getCatalogue() {
  return getStore().products.filter((p) => p.published);
}
export async function getCatalogueProduct(slug: string) {
  return (await getCatalogue()).find((p) => p.slug === slug);
}
