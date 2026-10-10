import Image from "next/image";
import { media, type MediaKey } from "@/data/media";
import { cx } from "@/lib/format";

/**
 * Editorial / campaign photograph slot. Renders the configured photograph, or a
 * tonal abstract backdrop while the photo hasn't been supplied.
 */
export function EditorialImage({
  slot,
  sizes = "100vw",
  priority = false,
  className,
  imageClassName,
}: {
  slot: MediaKey;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  const m = media[slot];
  return (
    <div
      className={cx("grain overflow-hidden", !/(^|\s)(absolute|fixed)(\s|$)/.test(className ?? "") && "relative", `tone-${m.tone}`, className)} data-placeholder={m.src ? undefined : "editorial"}>
      {m.src ? (
        <Image src={m.src} alt={m.alt} fill sizes={sizes} priority={priority} quality={85} className={cx("object-cover", imageClassName)} />
      ) : (
        <div aria-hidden="true" className={cx("absolute inset-0", imageClassName)}>
          {/* soft studio light pool */}
          <div className="absolute top-[18%] left-1/2 h-[70%] w-[55%] -translate-x-1/2 rounded-[50%] bg-white/[0.06] blur-3xl" />
          <div className="absolute bottom-[14%] left-1/2 h-[6%] w-[42%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-2xl" />
        </div>
      )}
    </div>
  );
}
