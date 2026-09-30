import { useEffect, useRef } from 'react';
import { HeroBackdrop } from '../media/HeroBackdrop';
import { AnimatedArrow } from '../ui/AnimatedArrow';
import { ButtonLink } from '../ui/Button';
import { CheckCircleIcon, PlaneIcon, RouteIcon, ShieldIcon, TruckIcon } from '../ui/Icons';

/** Scroll ranges (0–1) in which each chapter is on screen. */
const CHAPTERS: [number, number][] = [
  [0, 0.2],
  [0.24, 0.46],
  [0.5, 0.72],
  [0.76, 1.01],
];
const ROUTE_KM = 946; // Ahmedabad → Delhi by road, approx.

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Scroll-driven hero. The section is several screens tall; its stage stays
 * pinned while the scroll position drives the highway "footage" forward
 * (and backward) and fades the chapters in and out.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const chapters = useRef<(HTMLDivElement | null)[]>([]);
  const kmRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current!;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      progress.current = p;
      el.style.setProperty('--p', p.toFixed(4));
      chapters.current.forEach((c, i) => {
        if (!c) return;
        const [a, b] = CHAPTERS[i];
        const fadeIn = i === 0 ? 1 : smooth(a - 0.04, a + 0.03, p);
        const fadeOut = i === CHAPTERS.length - 1 ? 1 : 1 - smooth(b - 0.03, b + 0.04, p);
        const o = Math.min(fadeIn, fadeOut);
        c.style.opacity = o.toFixed(3);
        c.style.transform = `translate3d(0, ${((1 - fadeIn) * 40 - (1 - fadeOut) * 40).toFixed(1)}px, 0)`;
        c.style.visibility = o < 0.01 ? 'hidden' : 'visible';
        c.setAttribute('aria-hidden', o < 0.5 ? 'true' : 'false');
      });
      if (kmRef.current) kmRef.current.textContent = Math.round(smooth(0.5, 0.74, p) * ROUTE_KM).toLocaleString('en-IN');
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const setCh = (i: number) => (n: HTMLDivElement | null) => {
    chapters.current[i] = n;
  };

  return (
    <section className="hero-scroll" ref={root} aria-label="YA² — move anything, anywhere in India">
      <div className="hero-scroll__stage">
        <HeroBackdrop progress={progress} />

        <div className="container hero-scroll__content">
          {/* 0 — headline */}
          <div className="hero-ch hero-ch--intro" ref={setCh(0)}>
            <span className="eyebrow hero__eyebrow">Transport · Logistics · Air Cargo · Movers &amp; Packers</span>
            <h1 className="hero__title">
              <span className="hero__line">Move anything.</span>
              <span className="hero__line">
                Anywhere in <span className="text-gradient">India.</span>
              </span>
            </h1>
            <p className="lead hero__lead">
              Reliable air, road and relocation solutions designed to move your business, cargo and belongings safely across India.
            </p>
            <div className="hero__ctas">
              <ButtonLink to="/calculator" size="lg" arrow="right">
                Get a Quote
              </ButtonLink>
              <ButtonLink to="/track" size="lg" variant="outline-light" arrow="up-right">
                Track Shipment
              </ButtonLink>
            </div>
            <ul className="hero__facts">
              <li>
                <PlaneIcon /> Air cargo
              </li>
              <li>
                <TruckIcon /> Road FTL &amp; PTL
              </li>
              <li>
                <ShieldIcon /> Secure handling
              </li>
              <li>
                <RouteIcon /> All 36 States &amp; UTs
              </li>
            </ul>
          </div>

          {/* 1 — pickup */}
          <div className="hero-ch" ref={setCh(1)}>
            <span className="hero-ch__step">01 · Pickup</span>
            <h2 className="hero-ch__title">Collected from your doorstep.</h2>
            <p className="hero-ch__text">Our crew arrives in the booked slot, weighs, labels and seals every package before it leaves your hands.</p>
            <ul className="hero-ch__ticks">
              <li>
                <CheckCircleIcon /> Scheduled pickup slot
              </li>
              <li>
                <CheckCircleIcon /> Weighed, labelled &amp; sealed
              </li>
            </ul>
          </div>

          {/* 2 — highway + live tracking */}
          <div className="hero-ch hero-ch--track" ref={setCh(2)}>
            <div>
              <span className="hero-ch__step">02 · On the highway</span>
              <h2 className="hero-ch__title">Tracked every kilometre.</h2>
              <p className="hero-ch__text">Line-haul on India&rsquo;s national highways, with a scan at every hub and live status on your tracking page.</p>
            </div>
            <div className="hero-track card--glass">
              <div className="hero-track__top">
                <span className="badge badge--emerald badge--dot badge--live">In transit</span>
                <span className="tabular hero-track__id">YA2-2026-001284</span>
              </div>
              <div className="hero-track__route">
                <span>Ahmedabad</span>
                <AnimatedArrow direction="long" />
                <span>Delhi</span>
              </div>
              <div className="hero-track__bar" aria-hidden>
                <span />
              </div>
              <div className="hero-track__meta tabular">
                <span>
                  <span ref={kmRef}>0</span> / {ROUTE_KM.toLocaleString('en-IN')} km
                </span>
                <span>NH 48 · Road</span>
              </div>
            </div>
          </div>

          {/* 3 — delivered */}
          <div className="hero-ch" ref={setCh(3)}>
            <span className="hero-ch__step">03 · Delivered</span>
            <h2 className="hero-ch__title">
              Delivered. <span className="text-gradient">On time.</span>
            </h2>
            <p className="hero-ch__text">Proof of delivery recorded against your tracking ID. Your turn — get an instant estimate for your next shipment.</p>
            <div className="hero__ctas">
              <ButtonLink to="/calculator" size="lg" arrow="right">
                Get a Quote
              </ButtonLink>
              <ButtonLink to="/book" size="lg" variant="outline-light" arrow="up-right">
                Book a Shipment
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="hero-rail" aria-hidden>
          <span className="hero-rail__fill" />
          {['Start', 'Pickup', 'Highway', 'Delivered'].map((l, i) => (
            <span key={l} className="hero-rail__dot" style={{ ['--at' as string]: CHAPTERS[i][0] }}>
              <em>{l}</em>
            </span>
          ))}
        </div>

        <div className="hero-scroll__hint" aria-hidden>
          <span>Scroll to drive</span>
          <AnimatedArrow direction="down" />
        </div>
      </div>
    </section>
  );
}
