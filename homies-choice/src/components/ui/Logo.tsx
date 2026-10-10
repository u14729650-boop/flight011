import Image from "next/image";
import { siteConfig } from "@/config/site";
import { cx } from "@/lib/format";

/**
 * Brand mark. Uses the official logo file when `siteConfig.logo.src` is set;
 * otherwise renders an interim HC monogram + wordmark.
 */
export function Logo({ tone = "light", compact = false }: { tone?: "light" | "dark"; compact?: boolean }) {
  const color = tone === "light" ? "text-ivory" : "text-emerald";
  if (siteConfig.logo.src) {
    return (
      <Image
        src={siteConfig.logo.src}
        alt={siteConfig.name}
        width={siteConfig.logo.width}
        height={siteConfig.logo.height}
        priority
        className={compact ? "h-9 w-auto" : "h-11 w-auto"}
      />
    );
  }
  return (
    <span className={cx("flex items-center gap-3", color)}>
      <Monogram className={compact ? "h-9 w-9 max-[440px]:hidden" : "h-11 w-11"} />
      <span className="flex flex-col leading-none">
        <span className={cx("font-serif font-medium whitespace-nowrap", compact ? "text-[1.02rem] tracking-[0.14em]" : "text-[1.3rem] tracking-[0.2em]")}>HOMIES CHOICE</span>
        {!compact && (
          <span className="mt-1 text-[0.55rem] font-semibold tracking-[0.42em] text-gold uppercase">Perfumes · Ahmedabad</span>
        )}
      </span>
      <span className="sr-only">{siteConfig.name} — home</span>
    </span>
  );
}

export function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="none" stroke="#D5B477" strokeWidth="0.9" />
      <circle cx="24" cy="24" r="20" fill="none" stroke="#D5B477" strokeWidth="0.4" opacity="0.6" />
      <text
        x="24"
        y="30.5"
        textAnchor="middle"
        fontFamily="var(--font-cormorant), 'Cormorant Garamond', Georgia, serif"
        fontSize="19"
        fontWeight="500"
        letterSpacing="0.5"
        fill="#D5B477"
      >
        HC
      </text>
    </svg>
  );
}
