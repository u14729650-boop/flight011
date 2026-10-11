// Browser-only demo database for the preview build (admin edits live in localStorage).
import { products as starter, type Product } from "@/data/products";
import { siteConfig } from "@/config/site";
import type { AdminSettings, Enquiry } from "@/lib/admin-client";
import { starterBanners, type Banner } from "@/data/banners";

interface Store {
  products: Product[];
  banners: Banner[];
  enquiries: Enquiry[];
  settings: AdminSettings;
}

const KEY = "hc-preview-store-v1";
const listeners = new Set<() => void>();
let version = 0;

function fresh(): Store {
  return {
    products: structuredClone(starter),
    banners: structuredClone(starterBanners).map((b) => ({ ...b, id: crypto.randomUUID() })),
    enquiries: [],
    settings: { announcement: { enabled: siteConfig.announcement.enabled, text: siteConfig.announcement.text, href: siteConfig.announcement.href } },
  };
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {
    /* storage unavailable */
  }
  return fresh();
}

let store = load();

export function getStore(): Store {
  return store;
}

export function updateStore(fn: (s: Store) => Store) {
  store = fn(structuredClone(store));
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
  version++;
  listeners.forEach((l) => l());
}

export function resetStore() {
  updateStore(() => fresh());
}

export function subscribeStore(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function storeVersion() {
  return version;
}
