import { useEffect, useRef } from 'react';
import { AIR_REFERENCE_PRICES } from '../../config/pricing';
import { formatINR } from '../../lib/format';
import { QuickQuote } from '../calculator/QuickQuote';
import { AnimatedArrow } from '../ui/AnimatedArrow';
import { ButtonLink } from '../ui/Button';
import { CheckCircleIcon, PlaneIcon, RouteIcon, ShieldIcon, TruckIcon } from '../ui/Icons';

/**
 * Home hero over the fixed 3D sky: a glass copy panel, two tilted floating
 * cards that drift with scroll and pointer, and the quick-quote bar.
 */
export function Hero() {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      const s = Math.min(1, window.scrollY / window.innerHeight);
      el.style.setProperty('--s', s.toFixed(3));
      el.style.setProperty('--px', px.toFixed(3));
      el.style.setProperty('--py', py.toFixed(3));
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
      queue();
    };
    apply();
    window.addEventListener('scroll', queue, { passive: true });
    if (!window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const air100 = AIR_REFERENCE_PRICES.find((p) => p.kg === 100)!;

  return (
    <section className="ihero">
      <div className="container ihero__grid" ref={stage}>
        <div className="ihero__panel glass">
          <span className="eyebrow ihero__eyebrow">Air cargo · Road · Movers &amp; Packers · 36 States &amp; UTs</span>
          <h1 className="ihero__title">
            Move anything.
            <br />
            <span className="text-gradient">Anywhere in India.</span>
          </h1>
          <p className="ihero__lead">
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
          <ul className="ihero__facts">
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
              <RouteIcon /> Live tracking
            </li>
          </ul>
        </div>

        <div className="ihero__float" aria-hidden>
          <div className="tilt-card tilt-card--a glass">
            <span className="badge badge--emerald badge--dot badge--live">In transit · Air</span>
            <strong className="tabular">YA2-2026-001285</strong>
            <span className="tilt-card__route">
              Mumbai <AnimatedArrow direction="long" /> Bengaluru
            </span>
            <span className="tilt-card__bar">
              <span />
            </span>
            <span className="tilt-card__meta">
              <CheckCircleIcon /> Departed on the evening flight
            </span>
          </div>
          <div className="tilt-card tilt-card--b glass">
            <span className="tilt-card__label">Air cargo · 100 KG</span>
            <strong className="tabular tilt-card__price">{formatINR(air100.price)}</strong>
            <span className="tilt-card__meta">Indicative base price · 1–2 days</span>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="ihero__search glass">
          <div className="ihero__search-head">
            <span className="badge badge--blue">Instant estimate</span>
            <span className="ihero__search-note">Pickup, drop, weight and mode — that is all we need.</span>
          </div>
          <QuickQuote />
        </div>
      </div>
    </section>
  );
}
