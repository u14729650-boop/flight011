import { isLive, type BannerPlacement } from "@/data/banners";
import { getStore } from "./demo-store";

export async function getBanners(placement: BannerPlacement) {
  const now = new Date();
  return getStore()
    .banners.filter((b) => b.placement === placement && isLive(b, now))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
