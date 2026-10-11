/**
 * Browser-side client for the admin API. (The preview build swaps this module
 * for a local demo store.)
 */
import type { Product } from "@/data/products";
import type { Banner } from "@/data/banners";

import type { AdminSettings, AdminStatus, Enquiry } from "./admin-client-types";

export type { AdminSettings, AdminStatus, Enquiry };

export class AdminApiError extends Error {
  constructor(message: string, public status: number, public errors?: Record<string, string>) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/admin/${path}`, {
    ...init,
    credentials: "same-origin",
    headers: { ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }), "x-hc-admin": "1", ...init.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "login") {
    window.location.href = "/hc-admin/login";
  }
  if (!res.ok) throw new AdminApiError(data.error ?? "Something went wrong.", res.status, data.errors);
  return data as T;
}

export const adminApi = {
  isPreview: false,
  login: (username: string, password: string) => call<{ ok: true }>("login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => call<{ ok: true }>("logout", { method: "POST" }),
  status: () => call<AdminStatus>("status"),
  listProducts: () => call<{ products: Product[]; source: "database" | "starter" }>("products"),
  createProduct: (p: Product) => call<{ product: Product }>("products", { method: "POST", body: JSON.stringify(p) }),
  updateProduct: (slug: string, p: Product) =>
    call<{ product: Product }>(`products/${encodeURIComponent(slug)}`, { method: "PUT", body: JSON.stringify(p) }),
  deleteProduct: (slug: string) => call<{ ok: true }>(`products/${encodeURIComponent(slug)}`, { method: "DELETE" }),
  seed: () => call<{ ok: true; count: number }>("seed", { method: "POST" }),
  uploadImage: (file: File, folder: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    return call<{ src: string }>("upload", { method: "POST", body: fd });
  },
  listEnquiries: () => call<{ enquiries: Enquiry[]; database: boolean }>("enquiries"),
  setEnquiryHandled: (id: string, handled: boolean) =>
    call<{ ok: true }>(`enquiries/${id}`, { method: "PATCH", body: JSON.stringify({ handled }) }),
  listBanners: () => call<{ banners: Banner[]; source: "database" | "starter" }>("banners"),
  createBanner: (b: Banner) => call<{ banner: Banner }>("banners", { method: "POST", body: JSON.stringify(b) }),
  updateBanner: (id: string, b: Banner) => call<{ banner: Banner }>(`banners/${id}`, { method: "PUT", body: JSON.stringify(b) }),
  deleteBanner: (id: string) => call<{ ok: true }>(`banners/${id}`, { method: "DELETE" }),
  reorderBanners: (ids: string[]) => call<{ ok: true }>("banners/order", { method: "PUT", body: JSON.stringify({ ids }) }),
  getSettings: () => call<{ settings: AdminSettings }>("settings"),
  saveSettings: (s: AdminSettings) => call<{ settings: AdminSettings }>("settings", { method: "PUT", body: JSON.stringify(s) }),
};
