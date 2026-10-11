import type { Metadata } from "next";
import { BannerEditor } from "@/components/admin/BannerEditor";

export const metadata: Metadata = { title: "New banner" };

export default async function NewBanner({ searchParams }: { searchParams: Promise<{ placement?: string }> }) {
  const { placement } = await searchParams;
  return <BannerEditor initialPlacement={placement === "shop" ? "shop" : "home"} />;
}
