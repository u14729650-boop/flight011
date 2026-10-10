import { Suspense, use, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { navigate, useLocation } from "./shims/router";
import { getProduct } from "@/data/products";
import { getCollection } from "@/data/collections";
import { getPolicy } from "@/data/policies";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import HomePage from "@/app/page";
import ShopPage from "@/app/shop/page";
import CollectionPage from "@/app/collections/[slug]/page";
import ProductPage from "@/app/products/[slug]/page";
import PolicyPage from "@/app/policies/[slug]/page";
import CheckoutPage from "@/app/checkout/page";
import ContactPage from "@/app/contact/page";
import NotFound from "@/app/not-found";

// Async route components (they await `params`) are resolved once per path.
const cache = new Map<string, Promise<React.ReactNode>>();
function AsyncPage({ id, render }: { id: string; render: () => Promise<React.ReactNode> }) {
  if (!cache.has(id)) cache.set(id, render());
  return <>{use(cache.get(id)!)}</>;
}

function Route() {
  const { path } = useLocation();
  const [, section, slug] = path.split("/");
  const params = Promise.resolve({ slug: slug ?? "" });

  if (path === "/") return <HomePage />;
  if (path === "/shop") return <ShopPage />;
  if (path === "/checkout") return <CheckoutPage />;
  if (path === "/contact") return <ContactPage />;
  if (section === "collections" && slug && getCollection(slug))
    return <AsyncPage id={path} render={() => CollectionPage({ params })} />;
  if (section === "products" && slug && getProduct(slug))
    return <AsyncPage id={path} render={() => ProductPage({ params })} />;
  if (section === "policies" && slug && getPolicy(slug))
    return <AsyncPage id={path} render={() => PolicyPage({ params })} />;
  return <NotFound />;
}

function App() {
  const { path } = useLocation();
  useEffect(() => {
    // Route same-site links through the in-memory router.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a");
      const href = a?.getAttribute("href");
      if (!a || !href || !href.startsWith("/") || a.target === "_blank") return;
      e.preventDefault();
      navigate(href);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  useEffect(() => {
    document.title = path === "/" ? "Homies Choice" : `Homies Choice · ${path.split("/").filter(Boolean).join(" / ")}`;
  }, [path]);

  return (
    <CartProvider>
      <Header />
      <main id="main">
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <Route />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}

createRoot(document.getElementById("hc-root")!).render(<App />);
