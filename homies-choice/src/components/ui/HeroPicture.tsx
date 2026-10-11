import Image from "next/image";
import { media } from "@/data/media";
import { cx } from "@/lib/format";

/**
 * Hero imagery, art-directed by orientation:
 * - Portrait phones/tablets: the portrait composition (HC monogram in a gold arch) sits at the top,
 *   and the headline flows underneath it (see <HeroMobileSpacer />).
 * - Landscape and desktop: the landscape satin fills the section behind the text.
 * Both images are lazy so the hidden one is never downloaded.
 */
export function HeroPicture({ className }: { className?: string }) {
  const desktop = media.hero;
  const mobile = media.heroMobile;
  return (
    <div className={cx("overflow-hidden", className)} aria-hidden="true">
      {desktop.src && (
        <Image
          src={desktop.src}
          alt=""
          fill
          sizes="100vw"
          quality={85}
          loading="lazy"
          className="scale-105 object-cover portrait:max-lg:hidden"
        />
      )}
      {mobile.src && (
        <div className="absolute inset-x-0 top-0 hidden justify-center portrait:max-lg:flex">
          <div className="relative w-full max-w-[36rem] md:[mask-image:linear-gradient(90deg,transparent,black_18%,black_82%,transparent)]">
            <Image src={mobile.src} alt="" width={1080} height={1920} sizes="(min-width: 576px) 576px, 100vw" quality={85} loading="lazy" className="h-auto w-full" />
            {/* Fade the image into the hero colour beneath the monogram. */}
            <div className="absolute inset-x-0 top-[50%] bottom-0 bg-gradient-to-b from-transparent via-forest/90 via-35% to-forest" />
          </div>
        </div>
      )}
    </div>
  );
}

/** Reserves the space the portrait monogram occupies, so the headline never overlaps it. */
export function HeroMobileSpacer() {
  return <div aria-hidden="true" className="hidden h-[min(66vw,26rem)] portrait:max-lg:block" />;
}
