import { storeJsonLd } from "@/lib/seo";
import { getCatalogue } from "@/lib/server/catalogue-source";
import { getSettings } from "@/lib/server/settings";
import { CatalogueProvider } from "@/components/catalogue/CatalogueProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/ui/JsonLd";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [catalogue, settings] = await Promise.all([getCatalogue(), getSettings()]);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-gold focus:px-4 focus:py-2 focus:text-forest"
      >
        Skip to content
      </a>
      <CatalogueProvider products={catalogue}>
        <CartProvider>
          <Header announcement={settings.announcement} />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </CatalogueProvider>
      <JsonLd data={storeJsonLd()} />
    </>
  );
}
