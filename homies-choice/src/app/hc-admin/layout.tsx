import type { Metadata } from "next";

// The admin area is unlinked, noindex and password protected (see src/proxy.ts).
export const metadata: Metadata = {
  title: { default: "Studio", template: "%s · Studio" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
