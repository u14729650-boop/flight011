import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HERO_VIDEO } from '../../config/media';

/** Page scroll as 0–1. */
export const pageProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
};

/**
 * Fixed, full-screen moving background for the home page. Scrolling drives
 * it forward (and back). Uses configured footage when present, otherwise
 * the real-time 3D airliner scene (loaded on demand so other pages stay light).
 */
export function SkyBackdrop() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const scrim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    let raf = 0;

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        // Let the scene breathe in the hero, then settle behind the content.
        const vh = window.innerHeight;
        const s = Math.min(1, window.scrollY / (vh * 0.9));
        scrim.current?.style.setProperty('--scrim', s.toFixed(3));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (HERO_VIDEO.src && video.current) {
      const v = video.current;
      let shown = 0;
      const tick = () => {
        if (v.readyState >= 1 && v.duration) {
          shown += (pageProgress() - shown) * 0.15;
          const t = shown * (v.duration - 0.05);
          if (Math.abs(v.currentTime - t) > 1 / 30) v.currentTime = t;
        }
        if (!cancelled) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } else if (canvas.current) {
      import('./skyScene')
        .then(({ createSkyScene }) => {
          if (!cancelled && canvas.current) dispose = createSkyScene(canvas.current, pageProgress);
          canvas.current?.classList.add('is-ready');
        })
        .catch(() => canvas.current?.classList.add('is-failed'));
    }

    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      dispose?.();
    };
  }, []);

  // Portal to <body>: an animated/transformed ancestor would otherwise turn `position: fixed` into page-tall.
  return createPortal(
    <div className="sky-bg" aria-hidden>
      {HERO_VIDEO.src ? (
        <video ref={video} className="sky-bg__media" muted playsInline preload="auto" poster={HERO_VIDEO.poster || undefined}>
          {HERO_VIDEO.webm && <source src={HERO_VIDEO.webm} type="video/webm" />}
          <source src={HERO_VIDEO.src} type="video/mp4" />
        </video>
      ) : (
        <canvas ref={canvas} className="sky-bg__media sky-bg__canvas" />
      )}
      <div className="sky-bg__scrim" ref={scrim} />
    </div>,
    document.body,
  );
}
