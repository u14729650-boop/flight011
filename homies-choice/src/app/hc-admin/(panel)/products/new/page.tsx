import type { Metadata } from "next";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata: Metadata = { title: "New product" };

export default async function NewProduct({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  return <ProductEditor initialCategory={category === "watch" ? "watch" : "fragrance"} />;
}
