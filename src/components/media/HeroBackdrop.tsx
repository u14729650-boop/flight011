import { useEffect, useRef, type MutableRefObject } from 'react';
import { HERO_VIDEO } from '../../config/media';
import { HighwayScene } from './HighwayScene';

/**
 * Scroll-scrubbed moving background. With real footage configured, the
 * scroll position seeks the video (encode with a keyframe on every frame,
 * e.g. `ffmpeg -i in.mp4 -g 1 -an -vf scale=1920:-2 hero.mp4`, for smooth
 * scrubbing). Otherwise the rendered highway scene is driven by the same
 * progress value.
 */
export function HeroBackdrop({ progress }: { progress: MutableRefObject<number> }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    let raf = 0;
    let shown = 0;
    const tick = () => {
      if (v.readyState >= 1 && v.duration) {
        shown += (progress.current - shown) * 0.18;
        const t = shown * (v.duration - 0.05);
        if (Math.abs(v.currentTime - t) > 1 / 30) v.currentTime = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return (
    <div className="hero-backdrop" aria-hidden>
      {HERO_VIDEO.src ? (
        <video ref={video} className="hero-backdrop__media" muted playsInline preload="auto" poster={HERO_VIDEO.poster || undefined}>
          {HERO_VIDEO.webm && <source src={HERO_VIDEO.webm} type="video/webm" />}
          <source src={HERO_VIDEO.src} type="video/mp4" />
        </video>
      ) : (
        <HighwayScene className="hero-backdrop__media" progress={progress} />
      )}
      <div className="hero-backdrop__shade" />
    </div>
  );
}
