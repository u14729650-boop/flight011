"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { navigation, siteConfig } from "@/config/site";
import { cx } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";
import { Logo } from "@/components/ui/Logo";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useCart } from "@/components/cart/CartProvider";
import { SearchDialog } from "./SearchDialog";
import { MobileMenu } from "./MobileMenu";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function Header() {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close overlays on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const transparent = overHero && !scrolled;
  const announcement = siteConfig.announcement;

  return (
    <>
      <header className="on-dark fixed inset-x-0 top-0 z-40">
        {announcement.enabled && (
          <div
            className={cx(
              "overflow-hidden bg-forest text-center text-ivory/85 transition-[max-height] duration-500 ease-luxe",
              scrolled ? "max-h-0" : "max-h-10",
            )}
          >
            <p className="eyebrow truncate px-4 py-2.5 text-[0.58rem] tracking-[0.16em] md:text-[0.625rem] md:tracking-[0.22em]">
              {announcement.href ? (
                <Link href={announcement.href} className="hover:text-gold">
                  {announcement.text}
                </Link>
              ) : (
                announcement.text
              )}
            </p>
          </div>
        )}

        <div
          className={cx(
            "border-b transition-colors duration-500 ease-luxe",
            transparent ? "border-ivory/10 bg-transparent" : "border-gold/15 bg-emerald/[0.97] backdrop-blur-sm",
          )}
        >
          <div className="container-luxe grid h-[4.25rem] grid-cols-[1fr_auto_1fr] items-center lg:h-[4.75rem]">
            <div className="flex items-center gap-1 text-ivory">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="-ml-2 inline-flex h-11 w-11 items-center justify-center hover:text-gold lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" strokeWidth={1.4} />
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex h-11 items-center gap-2.5 px-2 text-ivory hover:text-gold lg:-ml-2"
                aria-label="Search perfumes"
              >
                <Search className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.4} />
                <span className="eyebrow hidden text-[0.625rem] lg:inline">Search</span>
              </button>
            </div>

            <Link href="/" aria-label={`${siteConfig.name} — home`} className="justify-self-center">
              <span className="lg:hidden">
                <Logo compact />
              </span>
              <span className="hidden lg:inline">
                <Logo />
              </span>
            </Link>

            <div className="flex items-center justify-end gap-1 text-ivory">
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center hover:text-gold"
                aria-label="Chat with us on WhatsApp (opens in a new tab)"
              >
                <WhatsAppIcon className="h-[1.15rem] w-[1.15rem]" />
              </a>
              <button
                type="button"
                onClick={cart.open}
                className="relative -mr-2 inline-flex h-11 w-11 items-center justify-center hover:text-gold"
                aria-label={`Open shopping bag, ${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`}
              >
                <ShoppingBag className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.4} />
                {cart.hydrated && cart.itemCount > 0 && (
                  <span className="absolute top-1.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-bold text-forest">
                    {cart.itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="container-luxe flex h-11 items-center justify-center gap-9 border-t border-ivory/[0.07]">
              {navigation.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "link-underline eyebrow pb-1 text-[0.65rem] transition-colors",
                        active ? "text-gold" : "text-ivory/85 hover:text-gold",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      {/* Reserve space under the fixed header on every page except the home hero. */}
      {!overHero && <div aria-hidden="true" className={cx(announcement.enabled ? "h-[6.6rem] lg:h-[9.65rem]" : "h-[4.25rem] lg:h-[7.5rem]")} />}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} isActive={(href) => isActive(pathname, href)} />
    </>
  );
}
