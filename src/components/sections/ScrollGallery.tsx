import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { cityByName } from '../../data/cities';
import { calculateQuote } from '../../lib/pricing';
import { formatINR } from '../../lib/format';
import { IndiaMap } from '../map/IndiaMap';
import { AnimatedArrow } from '../ui/AnimatedArrow';

const LANES: { from: string; to: string; mode: 'AIR' | 'ROAD'; kg: number; tag: string }[] = [
  { from: 'New Delhi', to: 'Mumbai', mode: 'AIR', kg: 25, tag: 'Metro express' },
  { from: 'Ahmedabad', to: 'Kolkata', mode: 'AIR', kg: 50, tag: 'Coast to coast' },
  { from: 'Bengaluru', to: 'Guwahati', mode: 'AIR', kg: 10, tag: 'North East link' },
  { from: 'Surat', to: 'Pune', mode: 'ROAD', kg: 200, tag: 'Textile lane' },
  { from: 'Chennai', to: 'Hyderabad', mode: 'ROAD', kg: 500, tag: 'Southern corridor' },
];

const label = (n: string) => (n === 'New Delhi' ? 'Delhi' : n);

/**
 * "Scroll. India moves with you." — lane cards that drift at different
 * speeds and tilt in 3D as the section scrolls through the viewport.
 */
export function ScrollGallery() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const t = (window.innerHeight - r.top) / (window.innerHeight + r.height); // 0 entering → 1 leaving
      el.style.setProperty('--t', Math.min(1, Math.max(0, t)).toFixed(4));
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

  return (
    <section className="gallery" ref={root}>
      <div className="container">
        <div className="gallery__head glass">
          <span className="eyebrow">Across India</span>
          <h2>
            Scroll. <span className="text-gradient">India moves with you.</span>
          </h2>
          <p>From Delhi mornings to Guwahati evenings — every lane with an instant estimate and one tracking ID.</p>
        </div>
      </div>
      <div className="gallery__track">
        {LANES.map((l, i) => {
          const a = cityByName(l.from);
          const b = cityByName(l.to);
          const q = calculateQuote({
            mode: l.mode,
            pickupState: a.state,
            destinationState: b.state,
            weightKg: l.kg,
            cargoType: 'PARCEL',
            speed: 'STANDARD',
            pickupCoords: a.coords,
            destinationCoords: b.coords,
          });
          return (
            <Link
              key={l.from + l.to}
              to={`/calculator?mode=${l.mode}&from=${encodeURIComponent(a.state)}&to=${encodeURIComponent(b.state)}&weight=${l.kg}`}
              className="lane-card glass arrow-host"
              style={{ ['--i' as string]: i }}
            >
              <div className="lane-card__map">
                <IndiaMap
                  showLabels={false}
                  animated
                  routes={[{ from: a.coords, to: b.coords, mode: l.mode === 'AIR' ? 'air' : 'road' }]}
                  markers={[
                    { coords: a.coords, kind: 'hub', hub: a.hub },
                    { coords: b.coords, kind: 'hub', hub: b.hub },
                  ]}
                  title={`${label(l.from)} to ${label(l.to)}`}
                />
              </div>
              <span className="lane-card__tag">{l.tag}</span>
              <strong className="lane-card__route">
                {label(l.from)} <AnimatedArrow direction="long" /> {label(l.to)}
              </strong>
              <span className="lane-card__meta tabular">
                {l.mode === 'AIR' ? 'Air' : 'Road'} · {l.kg} KG · {q.transitLabel}
              </span>
              <span className="lane-card__price tabular">
                from {formatINR(q.total)}
                <AnimatedArrow direction="up-right" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
