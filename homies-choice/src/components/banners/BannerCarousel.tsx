"use client";

import Link from "next/link";
import { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/data/banners";
import { cx } from "@/lib/format";
import { isExternalImage } from "@/lib/images";

const INTERVAL = 6500;

function Slide({ banner, active, index, total, variant }: { banner: Banner; active: boolean; index: number; total: number; variant: "home" | "shop" }) {
  const img = banner.image;
  const dark = banner.theme === "dark";
  const sizes = variant === "home" ? "(min-width: 1408px) 1328px, 100vw" : "(min-width: 1408px) 1328px, 100vw";
  const desktop = img && getImageProps({ src: img.src, alt: img.alt, width: img.width, height: img.height, sizes, quality: 75, unoptimized: isExternalImage(img.src), priority: index === 0 && variant === "shop" });
  const mobile =
    banner.mobileImage &&
    getImageProps({
      src: banner.mobileImage.src,
      alt: banner.mobileImage.alt,
      width: banner.mobileImage.width,
      height: banner.mobileImage.height,
      sizes: "100vw",
      quality: 75,
      unoptimized: isExternalImage(banner.mobileImage.src),
    });
  const external = banner.ctaHref?.startsWith("http");

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
      aria-hidden={!active}
      inert={!active}
      className={cx(
        "absolute inset-0 transition-[opacity,visibility] duration-1000 ease-luxe",
        active ? "visible z-10 opacity-100" : "invisible z-0 opacity-0",
      )}
    >
      {desktop && (
        <picture>
          {mobile && <source media="(max-width: 767px)" srcSet={mobile.props.srcSet} sizes="100vw" />}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            {...desktop.props}
            className={cx("absolute inset-0 h-full w-full object-cover transition-transform duration-[7s] ease-out", active ? "scale-[1.06]" : "scale-100")}
          />
        </picture>
      )}
      <div
        className={cx(
          "absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r",
          dark ? "from-forest/80 via-forest/30 to-transparent" : "from-ivory/80 via-ivory/30 to-transparent",
        )}
        aria-hidden="true"
      />
      <div className={cx("absolute inset-x-3 bottom-3 md:inset-x-auto md:top-1/2 md:bottom-auto md:left-8 md:-translate-y-1/2", variant === "shop" && "md:left-6")}>
        <div
          className={cx(
            "rounded-[1.5rem] p-6 md:max-w-lg md:p-8",
            dark ? "glass text-ivory" : "glass-light text-charcoal",
            active && "animate-fade-up",
          )}
        >
          {banner.eyebrow && <p className={cx("eyebrow text-[0.6rem]", dark ? "text-gold" : "text-gold-deep")}>{banner.eyebrow}</p>}
          <h3 className={cx("display mt-3", variant === "home" ? "text-[1.9rem] md:text-[2.8rem]" : "text-[1.6rem] md:text-[2.2rem]")}>{banner.title}</h3>
          {banner.subtitle && <p className={cx("mt-3 max-w-md text-sm leading-relaxed font-light", dark ? "text-ivory/80" : "text-charcoal/75")}>{banner.subtitle}</p>}
          {banner.ctaHref && banner.ctaLabel && (
            external ? (
              <a href={banner.ctaHref} target="_blank" rel="noopener noreferrer" className={cx("btn mt-6", dark ? "btn-gold" : "btn-dark")}>
                {banner.ctaLabel} <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <Link href={banner.ctaHref} className={cx("btn mt-6", dark ? "btn-gold" : "btn-dark")}>
                {banner.ctaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function BannerCarousel({ banners, variant = "home", label = "Featured" }: { banners: Banner[]; variant?: "home" | "shop"; label?: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touch = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (count < 2 || paused || reduced) return;
    const t = window.setTimeout(() => go(index + 1), INTERVAL);
    return () => window.clearTimeout(t);
  }, [index, paused, reduced, count, go]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className={cx("container-luxe", variant === "home" ? "pt-16 md:pt-24" : "pt-6")}
      data-reveal={variant === "home" ? "zoom" : undefined}
    >
      <div
        className={cx(
          "group relative isolate overflow-hidden rounded-[2rem] bg-forest shadow-[0_40px_80px_-50px_rgba(6,59,46,0.7)]",
          variant === "home" ? "aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/8]" : "aspect-[4/3] sm:aspect-[16/6] lg:aspect-[16/4.6]",
        )}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          touch.current = null;
        }}
      >
        {banners.map((b, i) => (
          <Slide key={b.id} banner={b} active={i === index} index={i} total={count} variant={variant} />
        ))}

        {count > 1 && (
          <>
            <div className="absolute top-4 right-4 z-20 flex gap-2 md:top-auto md:right-6 md:bottom-6">
              <button type="button" onClick={() => go(index - 1)} className="glass flex h-10 w-10 items-center justify-center rounded-full text-ivory transition-transform hover:scale-105" aria-label="Previous banner">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => go(index + 1)} className="glass flex h-10 w-10 items-center justify-center rounded-full text-ivory transition-transform hover:scale-105" aria-label="Next banner">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="absolute top-6 left-6 z-20 flex gap-1.5 md:top-auto md:bottom-8 md:left-1/2 md:-translate-x-1/2" role="tablist" aria-label="Choose banner">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show banner ${i + 1}: ${b.title}`}
                  onClick={() => go(i)}
                  className={cx("relative h-1.5 overflow-hidden rounded-full bg-ivory/35 transition-all duration-500", i === index ? "w-10" : "w-4 hover:bg-ivory/60")}
                >
                  {i === index && !paused && !reduced && (
                    <span key={index} className="absolute inset-y-0 left-0 rounded-full bg-gold" style={{ animation: `banner-progress ${INTERVAL}ms linear forwards` }} />
                  )}
                  {i === index && (paused || reduced) && <span className="absolute inset-0 rounded-full bg-gold" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
