"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { X } from "lucide-react";
import { navigation, siteConfig } from "@/config/site";
import { cx } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";
import { Logo } from "@/components/ui/Logo";
import { WhatsAppIcon } from "@/components/ui/icons";

export function MobileMenu({
  open,
  onOpenChange,
  isActive,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  isActive: (href: string) => boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="anim-overlay fixed inset-0 z-50 bg-forest/50 backdrop-blur-md" />
        <Dialog.Content className="anim-drawer-left on-dark fixed inset-y-2 left-2 z-50 flex w-[86vw] max-w-sm flex-col overflow-hidden rounded-[2rem] bg-forest/95 text-ivory shadow-2xl backdrop-blur-xl">
          <div className="flex h-[4.25rem] items-center justify-between border-b border-ivory/10 px-5">
            <Logo compact />
            <Dialog.Close className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-ivory/10 hover:text-gold" aria-label="Close menu">
              <X className="h-5 w-5" strokeWidth={1.4} />
            </Dialog.Close>
          </div>
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <Dialog.Description className="sr-only">Site navigation</Dialog.Description>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-6">
            <ul>
              {navigation.map((item) => (
                <li key={item.href} className="border-b border-ivory/[0.08]">
                  <Link
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cx("block py-4 font-serif text-[1.65rem] leading-none", isActive(item.href) ? "text-gold" : "hover:text-gold")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-ivory/10 p-5">
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-gold w-full">
              <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
            </a>
            <p className="mt-4 text-center text-xs text-ivory/60">{siteConfig.whatsapp.display} · {siteConfig.address.locality}</p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
