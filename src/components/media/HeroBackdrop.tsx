import { useEffect, useRef } from 'react';
import { HERO_VIDEO } from '../../config/media';
import { HighwayScene } from './HighwayScene';

/** Full-bleed moving background: real footage when configured, else the rendered highway scene. */
export function HeroBackdrop() {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      v.pause();
      return;
    }
    v.play().catch(() => {
      /* autoplay refused — the poster stays visible */
    });
  }, []);

  return (
    <div className="hero-backdrop" aria-hidden>
      {HERO_VIDEO.src ? (
        <video ref={video} className="hero-backdrop__media" autoPlay muted loop playsInline preload="auto" poster={HERO_VIDEO.poster || undefined}>
          {HERO_VIDEO.webm && <source src={HERO_VIDEO.webm} type="video/webm" />}
          <source src={HERO_VIDEO.src} type="video/mp4" />
        </video>
      ) : (
        <HighwayScene className="hero-backdrop__media" />
      )}
      <div className="hero-backdrop__shade" />
    </div>
  );
}
