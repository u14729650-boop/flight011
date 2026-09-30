import { useEffect, useRef } from 'react';
import { cityByName } from '../../data/cities';
import { formatINR } from '../../lib/format';
import { AIR_REFERENCE_PRICES } from '../../config/pricing';
import { HeroBackdrop } from '../media/HeroBackdrop';
import { IndiaMap, type MapMarker, type MapRoute } from '../map/IndiaMap';
import { ButtonLink } from '../ui/Button';
import { CheckCircleIcon, PlaneIcon, RouteIcon, ShieldIcon, TruckIcon } from '../ui/Icons';

const HERO_CITIES = ['Ahmedabad', 'Mumbai', 'New Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Jaipur', 'Surat', 'Kochi', 'Lucknow'];

const HERO_ROUTES: [string, string, 'air' | 'road'][] = [
  ['Ahmedabad', 'New Delhi', 'air'],
  ['Mumbai', 'Bengaluru', 'air'],
  ['New Delhi', 'Kolkata', 'air'],
  ['Mumbai', 'Chennai', 'air'],
  ['Ahmedabad', 'Mumbai', 'road'],
  ['Pune', 'Hyderabad', 'road'],
  ['Jaipur', 'Lucknow', 'road'],
  ['Surat', 'Pune', 'road'],
  ['Bengaluru', 'Kochi', 'road'],
];

const LEFT_LABELS = new Set(['Ahmedabad', 'Surat', 'Mumbai', 'Bengaluru', 'Kochi', 'Jaipur']);
const markers: MapMarker[] = HERO_CITIES.map((n) => {
  const c = cityByName(n);
  return { coords: c.coords, kind: 'hub', label: n === 'New Delhi' ? 'Delhi' : n, hub: c.hub, labelPos: LEFT_LABELS.has(n) ? 'left' : 'right' };
});
const routes: MapRoute[] = HERO_ROUTES.map(([a, b, mode]) => ({ from: cityByName(a).coords, to: cityByName(b).coords, mode }));

export function Hero() {
  const stage = useRef<HTMLDivElement>(null);

  // Subtle pointer parallax on the 3D composition (desktop only).
  useEffect(() => {
    const el = stage.current;
    if (!el || window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--px', x.toFixed(3));
        el.style.setProperty('--py', y.toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const air100 = AIR_REFERENCE_PRICES.find((p) => p.kg === 100)!;

  return (
    <section className="hero hero--cinematic">
      <HeroBackdrop />
      <div className="container hero__inner">
        <div className="hero__copy">
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

        <div className="hero__stage" ref={stage}>
          <div className="hero__map-wrap">
            <IndiaMap className="hero__map" title="Map of India with YA² routes" routes={routes} markers={markers} extrude showLabels />
          </div>


          <div className="hero__card hero__card--track card--glass">
            <span className="badge badge--emerald badge--dot badge--live">In transit</span>
            <strong className="tabular">YA2-2026-001284</strong>
            <span className="hero__card-route">
              Ahmedabad <span className="hero__card-arrow">⟶</span> Delhi
            </span>
            <span className="hero__progress" aria-hidden>
              <span />
            </span>
          </div>

          <div className="hero__card hero__card--quote card--glass">
            <span className="hero__card-label">Air · 100 KG</span>
            <strong className="tabular">{formatINR(air100.price)}</strong>
            <span className="hero__card-meta">
              <CheckCircleIcon /> Indicative base price
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
