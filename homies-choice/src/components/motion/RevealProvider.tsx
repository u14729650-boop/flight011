"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Scroll-reveal for any element marked `data-reveal` (optional `data-reveal-delay` in ms).
 * Content is fully visible without JavaScript; the animation only opts in once this runs.
 */
export function RevealProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    root.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)").forEach((el) => {
        const d = el.dataset.revealDelay;
        if (d) el.style.setProperty("--reveal-delay", d);
        io.observe(el);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return <>{children}</>;
}

// The first page load paints immediately (no fade, so it doesn't delay LCP);
// later client-side navigations fade in.
let navigated = false;

/** Fades each page in on navigation (not on the first load). */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [animate, setAnimate] = useState(navigated);
  useEffect(() => {
    if (navigated) setAnimate(true);
    return () => {
      navigated = true;
    };
  }, [pathname]);
  return (
    <div key={pathname} className={animate ? "page-transition" : undefined}>
      {children}
    </div>
  );
}
