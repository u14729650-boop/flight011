import { Suspense, use, useEffect, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { navigate, useLocation } from "./shims/router";
import { getStore, storeVersion, subscribeStore } from "./shims/demo-store";
import { isPreviewSignedIn } from "./shims/admin-client";
import { getCollection } from "@/data/collections";
import { getPolicy } from "@/data/policies";
import { CatalogueProvider } from "@/components/catalogue/CatalogueProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import HomePage from "@/app/(shop)/page";
import ShopPage from "@/app/(shop)/shop/page";
import WatchesPage from "@/app/(shop)/watches/page";
import CollectionPage from "@/app/(shop)/collections/[slug]/page";
import ProductPage from "@/app/(shop)/products/[slug]/page";
import PolicyPage from "@/app/(shop)/policies/[slug]/page";
import CheckoutPage from "@/app/(shop)/checkout/page";
import ContactPage from "@/app/(shop)/contact/page";
import NotFound from "@/app/(shop)/not-found";
import { AdminShell } from "@/components/admin/AdminShell";
import { LoginForm } from "@/components/admin/LoginForm";
import { Dashboard } from "@/components/admin/Dashboard";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { EnquiriesTable } from "@/components/admin/EnquiriesTable";
import { SettingsForm } from "@/components/admin/SettingsForm";

// Async route components (they await data) are resolved once per path and data version.
const cache = new Map<string, Promise<React.ReactNode>>();
function AsyncPage({ id, render }: { id: string; render: () => Promise<React.ReactNode> }) {
  if (!cache.has(id)) cache.set(id, render());
  return <>{use(cache.get(id)!)}</>;
}

function useStoreVersion() {
  return useSyncExternalStore(subscribeStore, storeVersion, storeVersion);
}

function ShopRoute({ path, version }: { path: string; version: number }) {
  const [, section, slug] = path.split("/");
  const params = Promise.resolve({ slug: slug ?? "" });
  const id = `${version}:${path}`;
  if (path === "/") return <AsyncPage id={id} render={() => HomePage()} />;
  if (path === "/shop") return <ShopPage />;
  if (path === "/watches") return <WatchesPage />;
  if (path === "/checkout") return <CheckoutPage />;
  if (path === "/contact") return <ContactPage />;
  if (section === "collections" && slug && getCollection(slug)) return <AsyncPage id={id} render={() => CollectionPage({ params })} />;
  if (section === "products" && slug && getStore().products.some((p) => p.slug === slug && p.published))
    return <AsyncPage id={id} render={() => ProductPage({ params })} />;
  if (section === "policies" && slug && getPolicy(slug)) return <AsyncPage id={id} render={() => PolicyPage({ params })} />;
  return <NotFound />;
}

function AdminRoute({ path, search }: { path: string; search: string }) {
  if (path === "/hc-admin/login" || !isPreviewSignedIn()) return <LoginForm />;
  const sub = path.replace(/^\/hc-admin/, "") || "/";
  let page: React.ReactNode;
  if (sub === "/") page = <Dashboard />;
  else if (sub === "/products") page = <ProductsTable />;
  else if (sub === "/products/new") page = <ProductEditor initialCategory={new URLSearchParams(search).get("category") === "watch" ? "watch" : "fragrance"} />;
  else if (sub.startsWith("/products/")) page = <ProductEditor key={sub} slug={decodeURIComponent(sub.slice("/products/".length))} />;
  else if (sub === "/enquiries") page = <EnquiriesTable />;
  else if (sub === "/settings") page = <SettingsForm />;
  else page = <Dashboard />;
  return <AdminShell>{page}</AdminShell>;
}

function App() {
  const { path, search } = useLocation();
  const version = useStoreVersion();
  const store = getStore();

  useEffect(() => {
    // Hidden entrance for the demo admin: open the preview link with #hc-admin.
    if (window.location.hash === "#hc-admin") navigate("/hc-admin");
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a");
      const href = a?.getAttribute("href");
      if (!a || !href || !href.startsWith("/")) return;
      e.preventDefault();
      navigate(href);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    document.title = path === "/" ? "Homies Choice" : `Homies Choice · ${path.split("/").filter(Boolean).join(" / ")}`;
  }, [path]);

  if (path.startsWith("/hc-admin")) return <AdminRoute path={path} search={search} />;

  return (
    <CatalogueProvider products={store.products.filter((p) => p.published)}>
      <CartProvider>
        <Header announcement={store.settings.announcement} />
        <main id="main">
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <ShopRoute path={path} version={version} />
          </Suspense>
        </main>
        <Footer />
        <CartDrawer />
      </CartProvider>
    </CatalogueProvider>
  );
}

createRoot(document.getElementById("hc-root")!).render(<App />);
