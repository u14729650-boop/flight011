"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ExternalLink, Gauge, LogOut, Menu, MessageSquareText, Package, Settings, X } from "lucide-react";
import type { Product } from "@/data/products";
import { adminApi, type AdminStatus } from "@/lib/admin-client";
import { cx } from "@/lib/format";
import { Logo } from "@/components/ui/Logo";

interface AdminData {
  status: AdminStatus | null;
  products: Product[] | null;
  source: "database" | "starter" | null;
  error: string | null;
  refresh: () => Promise<void>;
}

const AdminDataContext = createContext<AdminData | null>(null);

export function useAdminData(): AdminData {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used inside <AdminShell>");
  return ctx;
}

const nav = [
  { href: "/hc-admin", label: "Overview", icon: Gauge },
  { href: "/hc-admin/products", label: "Products", icon: Package },
  { href: "/hc-admin/enquiries", label: "Enquiries", icon: MessageSquareText },
  { href: "/hc-admin/settings", label: "Store settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<Omit<AdminData, "refresh">>({ status: null, products: null, source: null, error: null });

  const refresh = useCallback(async () => {
    try {
      const [status, list] = await Promise.all([adminApi.status(), adminApi.listProducts()]);
      setData({ status, products: list.products, source: list.source, error: null });
    } catch (err) {
      setData((d) => ({ ...d, error: err instanceof Error ? err.message : "Couldn't load data." }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const logout = async () => {
    await adminApi.logout().catch(() => {});
    router.replace("/hc-admin/login");
  };

  const isActive = (href: string) => (href === "/hc-admin" ? pathname === href : pathname.startsWith(href));

  const sidebar = (
    <div className="on-dark flex h-full flex-col bg-forest text-ivory">
      <div className="flex h-20 items-center justify-between border-b border-ivory/10 px-6">
        <Link href="/hc-admin" aria-label="Admin overview">
          <Logo compact />
        </Link>
        <button type="button" onClick={() => setMenuOpen(false)} className="inline-flex h-10 w-10 items-center justify-center lg:hidden" aria-label="Close menu">
          <X className="h-5 w-5" strokeWidth={1.4} />
        </button>
      </div>
      <p className="eyebrow px-6 pt-7 text-[0.58rem] text-gold">Studio</p>
      <nav aria-label="Admin" className="mt-3 flex-1 px-3">
        <ul className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cx(
                  "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                  isActive(href) ? "bg-ivory/[0.08] text-gold" : "text-ivory/75 hover:bg-ivory/[0.04] hover:text-ivory",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-1 border-t border-ivory/10 p-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 text-sm text-ivory/75 hover:text-ivory">
          <ExternalLink className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> View store
        </a>
        <button type="button" onClick={logout} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-ivory/75 hover:text-ivory">
          <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <AdminDataContext.Provider value={{ ...data, refresh }}>
      <div className="min-h-screen bg-[#f3eee4] text-charcoal lg:grid lg:grid-cols-[16rem_1fr]">
        <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>

        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
            <button type="button" className="absolute inset-0 bg-forest/60" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
            <div className="absolute inset-y-0 left-0 w-72">{sidebar}</div>
          </div>
        )}

        <div className="min-w-0">
          <header className="on-dark flex h-16 items-center justify-between bg-forest px-5 text-ivory lg:hidden">
            <button type="button" onClick={() => setMenuOpen(true)} className="-ml-2 inline-flex h-11 w-11 items-center justify-center" aria-label="Open menu">
              <Menu className="h-5 w-5" strokeWidth={1.4} />
            </button>
            <Logo compact />
            <span className="w-9" />
          </header>

          {adminApi.isPreview && (
            <div className="border-b border-gold/40 bg-gold/[0.12] px-5 py-3 text-sm md:px-10">
              Preview demo: changes are saved in this browser only and show up in this preview&rsquo;s shop.
            </div>
          )}
          {data.status && !data.status.database && (
            <div className="border-b border-gold/40 bg-gold/[0.12] px-5 py-3 text-sm md:px-10">
              <strong>Read-only:</strong> no database is connected, so the shop uses the built-in catalogue. Connect Supabase
              (see README → “Admin panel”) to edit products, upload photos and receive enquiries here.
            </div>
          )}
          {data.status?.database && !data.status.seeded && (
            <div className="border-b border-gold/40 bg-gold/[0.12] px-5 py-3 text-sm md:px-10">
              The database is connected but empty. Go to <Link href="/hc-admin" className="underline">Overview</Link> and import the starter catalogue to begin.
            </div>
          )}

          <main className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-12">{children}</main>
        </div>
      </div>
    </AdminDataContext.Provider>
  );
}
