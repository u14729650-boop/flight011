import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import { siteConfig } from "@/config/site";
import { getSettings } from "@/lib/server/settings";
import "./globals.css";

// Display: Bodoni Moda — a high-contrast fashion serif with optical sizing.
const display = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});

// Body: Jost — a geometric sans that echoes the HOMIES CHOICE wordmark.
const body = Jost({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// The default title and description are set in Dashboard → Store settings → Search engines.
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSettings();
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: seo.title,
      template: "%s | HOMIES CHOICE Ahmedabad",
    },
    description: seo.description,
    applicationName: siteConfig.name,
    keywords: [
      "perfume shop in Ahmedabad",
      "Arabic perfumes in Ahmedabad",
      "designer fragrances in Ahmedabad",
      "Homies Choice perfumes",
      "men's fragrances",
      "women's fragrances",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: "en_IN",
      url: "/",
      title: "HOMIES CHOICE — Find your signature scent",
      description: seo.description,
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#021C16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
