import type { Metadata } from "next";
import { BannerEditor } from "@/components/admin/BannerEditor";

export const metadata: Metadata = { title: "Edit banner" };

export default async function EditBanner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BannerEditor key={id} id={id} />;
}
