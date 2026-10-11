// Browser-only demo database for the preview build (admin edits live in localStorage).
import { products as starter, type Product } from "@/data/products";
import type { Enquiry } from "@/lib/admin-client";
import type { Order } from "@/lib/orders";
import { defaultSettings, parseSettings, type StoreSettings } from "@/lib/store-settings";
import { starterBanners, type Banner } from "@/data/banners";

interface Store {
  products: Product[];
  banners: Banner[];
  enquiries: Enquiry[];
  orders: Order[];
  settings: StoreSettings;
}

const KEY = "hc-preview-store-v1";
const listeners = new Set<() => void>();
let version = 0;

function fresh(): Store {
  return {
    products: structuredClone(starter),
    banners: structuredClone(starterBanners).map((b) => ({ ...b, id: crypto.randomUUID() })),
    enquiries: [],
    orders: [],
    settings: structuredClone(defaultSettings),
  };
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Older demo data only had the announcement bar: fill in the rest.
      return { ...fresh(), ...saved, settings: parseSettings(saved.settings) };
    }
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
