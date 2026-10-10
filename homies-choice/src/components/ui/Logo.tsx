import Image from "next/image";
import { siteConfig } from "@/config/site";
import { cx } from "@/lib/format";

const { monogram, wordmark } = siteConfig.logo;

/** The official HC monogram + HOMIES CHOICE wordmark (for dark backgrounds). */
export function Logo({ compact = false, priority = false }: { compact?: boolean; priority?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Image
        src={monogram.src}
        alt=""
        width={monogram.width}
        height={monogram.height}
        priority={priority}
        sizes={compact ? "36px" : "48px"}
        className={cx("w-auto shrink-0", compact ? "h-9 max-[440px]:hidden" : "h-12")}
      />
      <Image
        src={wordmark.src}
        alt={siteConfig.name}
        width={wordmark.width}
        height={wordmark.height}
        priority={priority}
        sizes={compact ? "170px" : "230px"}
        className={cx("w-auto", compact ? "h-[0.85rem]" : "h-[1.15rem]")}
      />
    </span>
  );
}

/** Monogram on its own (e.g. decorative frames). */
export function Monogram({ className }: { className?: string }) {
  return <Image src={monogram.src} alt="" width={monogram.width} height={monogram.height} className={cx("w-auto", className)} />;
}
