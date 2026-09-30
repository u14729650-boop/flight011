import { useId, useMemo, useState } from 'react';
import { INDIA_MAP_VIEWBOX, INDIA_OUTLINE_PATH, INDIA_STATE_SHAPES } from '../../data/indiaMap.generated';
import type { City } from '../../data/cities';
import { arcPath, project } from '../../lib/geo';

export interface MapRoute {
  from: [number, number];
  to: [number, number];
  mode: 'air' | 'road';
  id?: string;
}

export interface MapMarker {
  coords: [number, number];
  kind: 'pickup' | 'drop' | 'hub' | 'city';
  label?: string;
  labelPos?: 'left' | 'right';
  /** Tooltip text (defaults to the label). */
  name?: string;
  hub?: City['hub'];
}

interface Props {
  routes?: MapRoute[];
  markers?: MapMarker[];
  highlight?: string[];
  interactive?: boolean;
  showLabels?: boolean;
  /** Draw a thick "extruded" base under the map for a 3D slab effect. */
  extrude?: boolean;
  animated?: boolean;
  className?: string;
  title?: string;
  /** Crop to mainland (hides the far-south-east Andaman chain margin). */
  viewBox?: string;
  onStateSelect?: (name: string) => void;
}

/**
 * India map drawn from DataMeet's official state boundaries (all 28 States
 * and 8 UTs). Cities, routes and markers are placed with the same Mercator
 * projection used to generate the boundaries, so positions are accurate.
 */
export function IndiaMap({
  routes = [],
  markers = [],
  highlight = [],
  interactive = false,
  showLabels = true,
  extrude = false,
  animated = true,
  className = '',
  title = 'Map of India showing YA² routes',
  viewBox,
  onStateSelect,
}: Props) {
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<string | null>(null);
  const hl = useMemo(() => new Set(highlight), [highlight]);

  const projectedRoutes = useMemo(
    () =>
      routes.map((r, i) => {
        const a = project(r.from);
        const b = project(r.to);
        return { ...r, d: arcPath(a, b, r.mode === 'air' ? 0.28 : 0.12), key: r.id ?? `${i}` };
      }),
    [routes],
  );

  const vb = viewBox ?? `0 0 ${INDIA_MAP_VIEWBOX.width} ${INDIA_MAP_VIEWBOX.height}`;

  return (
    <div className={`india-map ${className}`} data-animated={animated || undefined}>
      <svg viewBox={vb} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`${uid}land`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="im-land-a" />
            <stop offset="1" className="im-land-b" />
          </linearGradient>
          <linearGradient id={`${uid}air`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#267DFF" stopOpacity="0.2" />
            <stop offset="1" stopColor="#267DFF" />
          </linearGradient>
          <filter id={`${uid}glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {extrude && (
          <g className="im-extrude" aria-hidden>
            {[18, 14, 10, 6].map((dy) => (
              <path key={dy} d={INDIA_OUTLINE_PATH} transform={`translate(0 ${dy})`} />
            ))}
          </g>
        )}

        <g className="im-states">
          {INDIA_STATE_SHAPES.map((s) => (
            <path
              key={s.name}
              d={s.d}
              fill={`url(#${uid}land)`}
              className={`im-state ${hl.has(s.name) ? 'is-hl' : ''} ${hover === s.name ? 'is-hover' : ''}`}
              onMouseEnter={interactive ? () => setHover(s.name) : undefined}
              onMouseLeave={interactive ? () => setHover(null) : undefined}
              onClick={interactive ? () => (setHover(s.name), onStateSelect?.(s.name)) : undefined}
            >
              <title>{s.name}</title>
            </path>
          ))}
        </g>
        <path className="im-outline" d={INDIA_OUTLINE_PATH} />

        <g className="im-routes">
          {projectedRoutes.map((r, i) => (
            <g key={r.key} className={`im-route im-route--${r.mode}`} style={{ ['--d' as string]: `${(i % 6) * 0.45}s` }}>
              <path d={r.d} className="im-route__base" />
              <path d={r.d} className="im-route__flow" pathLength={100} />
              {animated && (
                <circle r={r.mode === 'air' ? 5.5 : 5} className="im-route__dot">
                  <animateMotion dur={`${r.mode === 'air' ? 3.6 : 5.2}s`} begin={`${(i % 6) * 0.45}s`} repeatCount="indefinite" path={r.d} rotate="auto" />
                </circle>
              )}
            </g>
          ))}
        </g>

        <g className="im-markers">
          {markers.map((m, i) => {
            const [x, y] = project(m.coords);
            if (m.kind === 'pickup' || m.kind === 'drop') {
              return (
                <g key={i} className={`im-pin im-pin--${m.kind}`} transform={`translate(${x} ${y})`}>
                  <ellipse cx="0" cy="2" rx="12" ry="4.5" className="im-pin__shadow" />
                  <circle r="18" className="im-pin__pulse" />
                  <path d="M0 0 C 0 0 -17 -20 -17 -34 A 17 17 0 0 1 17 -34 C 17 -20 0 0 0 0 Z" className="im-pin__body" />
                  <circle cy="-34" r="7" fill="#fff" />
                  {m.label && (
                    <text y="-60" textAnchor="middle" className="im-pin__label">
                      {m.label}
                    </text>
                  )}
                </g>
              );
            }
            return (
              <g key={i} className={`im-city im-city--${m.hub ?? 'none'}`} transform={`translate(${x} ${y})`}>
                {(m.name ?? m.label) && <title>{m.name ?? m.label}</title>}
                {m.kind === 'hub' && <circle r="14" className="im-city__ring" style={{ animationDelay: `${(i % 7) * 0.3}s` }} />}
                <circle r={m.kind === 'hub' ? 6 : 4.5} className="im-city__dot" />
                {showLabels && m.label && (
                  <text x={m.labelPos === 'left' ? -11 : 11} y="7" textAnchor={m.labelPos === 'left' ? 'end' : 'start'} className="im-city__label">
                    {m.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      {interactive && (
        <div className="india-map__readout" aria-live="polite">
          {hover ?? 'Hover or tap a state'}
        </div>
      )}
    </div>
  );
}
