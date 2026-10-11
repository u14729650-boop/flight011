import type { Metadata } from "next";
import { BannersManager } from "@/components/admin/BannersManager";

export const metadata: Metadata = { title: "Banners" };

export default function AdminBanners() {
  return <BannersManager />;
}
