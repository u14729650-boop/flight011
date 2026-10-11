import { getImageProps } from "next/image";
import { media } from "@/data/media";
import { cx } from "@/lib/format";

/**
 * Hero imagery, art-directed by orientation with a single high-priority <picture>:
 * - Portrait phones/tablets get the portrait composition (HC monogram in a gold arch),
 *   pinned to the top so the headline flows underneath it (see <HeroMobileSpacer />).
 * - Landscape and desktop get the landscape satin, covering the section.
 * The browser downloads only the source that matches, and starts it immediately (LCP).
 */
export function HeroPicture({ className }: { className?: string }) {
  const desktop = media.hero;
  const mobile = media.heroMobile;
  if (!desktop.src || !mobile.src) return <div className={cx("tone-emerald grain", className)} aria-hidden="true" />;

  const {
    props: { srcSet: desktopSet },
  } = getImageProps({ alt: "", src: desktop.src, width: 1200, height: 1600, sizes: "100vw", quality: 85 });
  const {
    props: { srcSet: mobileSet, ...img },
  } = getImageProps({
    alt: "",
    src: mobile.src,
    width: 1080,
    height: 1920,
    sizes: "(min-width: 576px) 576px, 100vw",
    quality: 85,
    loading: "eager",
    fetchPriority: "high",
  });

  return (
    <div className={cx("overflow-hidden", className)} aria-hidden="true">
      <div className="absolute inset-0 portrait:max-lg:inset-x-0 portrait:max-lg:bottom-auto portrait:max-lg:mx-auto portrait:max-lg:max-w-[36rem] md:portrait:max-lg:[mask-image:linear-gradient(90deg,transparent,black_18%,black_82%,transparent)]">
        <picture>
          <source media="(orientation: portrait) and (max-width: 1023px)" srcSet={mobileSet} sizes="(min-width: 576px) 576px, 100vw" />
          <source srcSet={desktopSet} sizes="100vw" />
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            {...img}
            srcSet={mobileSet}
            className="h-full w-full scale-105 object-cover portrait:max-lg:h-auto portrait:max-lg:scale-100"
          />
        </picture>
        {/* Portrait: fade the image into the hero colour beneath the monogram. */}
        <div className="absolute inset-x-0 top-[50%] bottom-0 hidden bg-gradient-to-b from-transparent via-forest/90 via-35% to-forest portrait:max-lg:block" />
      </div>
    </div>
  );
}

/** Reserves the space the portrait monogram occupies, so the headline never overlaps it. */
export function HeroMobileSpacer() {
  return <div aria-hidden="true" className="hidden h-[min(66vw,26rem)] portrait:max-lg:block" />;
}

const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Backdrop behind the 3D bottle. Desktop gets the emerald satin; phones get a
 * light-weight glow (the bottle is the picture there), so they skip the download.
 */
export function HeroBackdrop({ className }: { className?: string }) {
  const desktop = media.hero;
  const glow = (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_22%,rgba(16,98,74,0.85),transparent_58%),radial-gradient(ellipse_at_80%_90%,rgba(213,180,119,0.12),transparent_50%)] lg:hidden" />
  );
  if (!desktop.src) return <div className={cx("tone-emerald grain", className)} aria-hidden="true">{glow}</div>;
  const {
    props: { srcSet, ...img },
  } = getImageProps({ alt: "", src: desktop.src, width: 1200, height: 1600, sizes: "100vw", quality: 80 });
  return (
    <div className={cx("overflow-hidden bg-forest", className)} aria-hidden="true">
      {glow}
      <picture>
        <source media="(min-width: 1024px)" srcSet={srcSet} sizes="100vw" />
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img {...img} src={BLANK} srcSet={BLANK} className="h-full w-full scale-105 object-cover max-lg:hidden" />
      </picture>
    </div>
  );
}
