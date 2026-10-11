// Demo implementation of the admin API for the browser-only preview.
import type { Product } from "@/data/products";
import { parseProductInput } from "@/lib/product-schema";
import { parseBannerInput } from "@/lib/banner-schema";
import type { Banner } from "@/data/banners";
import { getStore, updateStore } from "./demo-store";

export type { AdminStatus, Enquiry, AdminSettings, Order } from "@/lib/admin-client-types";
import type { AdminSettings } from "@/lib/admin-client-types";
import { isOrderStatus, type OrderStatus } from "@/lib/orders";
import { parseSettings, settingsProblems } from "@/lib/store-settings";

export class AdminApiError extends Error {
  constructor(message: string, public status: number, public errors?: Record<string, string>) {
    super(message);
  }
}

const SESSION = "hc-preview-admin";
// Only SHA-256 fingerprints of the demo credentials ship in the preview bundle.
const USER_SHA256 = "58b14d4a701392e166e00414188cec0f0984f8a6b5ab8985de1b735820071f1f";
const PASS_SHA256 = "0201c7775611d7a61e5e921d9fd968578b21170e3a7a29ca2736bf08b465112a";
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export const isPreviewSignedIn = () => {
  try {
    return sessionStorage.getItem(SESSION) === "1";
  } catch {
    return false;
  }
};
const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));

function validate(p: Product) {
  const { product, errors } = parseProductInput(p, { allowDataImages: true });
  if (Object.keys(errors).length) throw new AdminApiError("Please fix the highlighted fields.", 422, errors);
  return product;
}

export const adminApi = {
  isPreview: true,
  async login(username: string, password: string) {
    const [u, pw] = await Promise.all([sha256(username.trim().toLowerCase()), sha256(password)]);
    if (u !== USER_SHA256 || pw !== PASS_SHA256) {
      await wait(null);
      throw new AdminApiError("That username or password isn't right.", 401);
    }
    try {
      sessionStorage.setItem(SESSION, "1");
    } catch {
      /* ignore */
    }
    return wait({ ok: true as const });
  },
  async logout() {
    try {
      sessionStorage.removeItem(SESSION);
    } catch {
      /* ignore */
    }
    return { ok: true as const };
  },
  status: () => wait({ database: true, seeded: true }),
  listProducts: () => wait({ products: getStore().products, source: "database" as const }),
  async createProduct(p: Product) {
    const product = validate(p);
    if (getStore().products.some((x) => x.slug === product.slug))
      throw new AdminApiError("A product with this web address already exists.", 409, { slug: "Already in use." });
    updateStore((s) => ({ ...s, products: [...s.products, product] }));
    return wait({ product });
  },
  async updateProduct(slug: string, p: Product) {
    const product = validate(p);
    if (product.slug !== slug && getStore().products.some((x) => x.slug === product.slug))
      throw new AdminApiError("A product with this web address already exists.", 409, { slug: "Already in use." });
    updateStore((s) => ({ ...s, products: s.products.map((x) => (x.slug === slug ? product : x)) }));
    return wait({ product });
  },
  async deleteProduct(slug: string) {
    updateStore((s) => ({ ...s, products: s.products.filter((x) => x.slug !== slug) }));
    return wait({ ok: true as const });
  },
  seed: async () => wait({ ok: true as const, count: 0 }),
  async uploadImage(file: File) {
    if (file.size > 1.5 * 1024 * 1024) throw new AdminApiError("In the preview, photos must be under 1.5 MB (the live site allows 6 MB).", 413);
    const src = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new AdminApiError("Couldn't read that file.", 400));
      r.readAsDataURL(file);
    });
    return { src };
  },
  listEnquiries: () => wait({ enquiries: getStore().enquiries, database: true }),
  async setEnquiryHandled(id: string, handled: boolean) {
    updateStore((s) => ({ ...s, enquiries: s.enquiries.map((e) => (e.id === id ? { ...e, handled } : e)) }));
    return { ok: true as const };
  },
  listBanners: () => wait({ banners: getStore().banners, source: "database" as const }),
  async createBanner(b: Banner) {
    const { banner, errors } = parseBannerInput(b, { allowDataImages: true });
    if (Object.keys(errors).length) throw new AdminApiError("Please fix the highlighted fields.", 422, errors);
    const sortOrder = getStore().banners.filter((x) => x.placement === banner.placement).reduce((m, x) => Math.max(m, x.sortOrder + 1), 0);
    const saved = { ...banner, id: crypto.randomUUID(), sortOrder };
    updateStore((s) => ({ ...s, banners: [...s.banners, saved] }));
    return wait({ banner: saved });
  },
  async updateBanner(id: string, b: Banner) {
    const { banner, errors } = parseBannerInput(b, { allowDataImages: true });
    if (Object.keys(errors).length) throw new AdminApiError("Please fix the highlighted fields.", 422, errors);
    const saved = { ...banner, id };
    updateStore((s) => ({ ...s, banners: s.banners.map((x) => (x.id === id ? { ...saved, sortOrder: x.sortOrder } : x)) }));
    return wait({ banner: saved });
  },
  async deleteBanner(id: string) {
    updateStore((s) => ({ ...s, banners: s.banners.filter((x) => x.id !== id) }));
    return wait({ ok: true as const });
  },
  async reorderBanners(ids: string[]) {
    updateStore((s) => ({ ...s, banners: s.banners.map((b) => (ids.includes(b.id) ? { ...b, sortOrder: ids.indexOf(b.id) } : b)) }));
    return wait({ ok: true as const });
  },
  getSettings: () => wait({ settings: getStore().settings }),
  async saveSettings(patch: Partial<AdminSettings>) {
    const problems = settingsProblems(patch);
    if (problems.length) throw new AdminApiError(problems.join(" "), 422);
    const settings = parseSettings(patch, getStore().settings);
    updateStore((s) => ({ ...s, settings }));
    return wait({ settings });
  },
  listOrders: () => wait({ orders: getStore().orders, database: true }),
  async setOrderStatus(id: string, status: OrderStatus) {
    if (!isOrderStatus(status)) throw new AdminApiError("Unknown status.", 422);
    updateStore((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
    return { ok: true as const };
  },
};
