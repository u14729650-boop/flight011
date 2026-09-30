import { useId } from 'react';
import { circleXY, circleXZ, cuboid, iso, leftFaceMatrix, poly, rightFaceMatrix } from './iso';

interface ObjProps {
  className?: string;
  width?: number | string;
  title?: string;
}

const a11y = (title?: string) => (title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const });

/* --------------------------------- Cargo box -------------------------------- */

const BOX_TONES = {
  kraft: { top: ['#F3CE98', '#E6B574'], left: ['#D59B57', '#C78A46'], right: ['#B97A3B', '#A56A30'], tape: '#E9C387', tapeDark: '#B98E52' },
  blue: { top: ['#6FA8FF', '#3F88FF'], left: ['#2A74F0', '#1A62DB'], right: ['#1450BD', '#0E3F99'], tape: '#9CC3FF', tapeDark: '#3C6FC4' },
  emerald: { top: ['#5BE3B6', '#23C995'], left: ['#12AE7F', '#0B9A6F'], right: ['#08845F', '#066B4D'], tape: '#9AF0D2', tapeDark: '#2A9D78' },
  white: { top: ['#FFFFFF', '#EEF3F9'], left: ['#DDE6F1', '#CFDAE8'], right: ['#BCCADC', '#A9B9CE'], tape: '#E3F0FF', tapeDark: '#9FB4CF' },
} as const;

export function Cargo3D({ className = '', width = 120, title, tone = 'kraft', label = true }: ObjProps & { tone?: keyof typeof BOX_TONES; label?: boolean }) {
  const id = useId().replace(/:/g, '');
  const t = BOX_TONES[tone];
  const f = cuboid(0, 0, 0, 60, 60, 52);
  const tapeTop = poly([iso(26, 0, 52), iso(34, 0, 52), iso(34, 60, 52), iso(26, 60, 52)]);
  const tapeLeft = poly([iso(26, 60, 52), iso(34, 60, 52), iso(34, 60, 30), iso(26, 60, 30)]);
  const shadow = circleXY(34, 34, 0, 44);
  return (
    <svg className={`obj3d ${className}`} width={width} viewBox="-60 -60 120 128" {...a11y(title)}>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.top[0]} />
          <stop offset="1" stopColor={t.top[1]} />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.left[0]} />
          <stop offset="1" stopColor={t.left[1]} />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.right[0]} />
          <stop offset="1" stopColor={t.right[1]} />
        </linearGradient>
        <radialGradient id={`${id}s`}>
          <stop offset="0" stopColor="#071A2F" stopOpacity="0.32" />
          <stop offset="1" stopColor="#071A2F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <polygon points={shadow} fill={`url(#${id}s)`} />
      <polygon points={f.left} fill={`url(#${id}l)`} />
      <polygon points={f.right} fill={`url(#${id}r)`} />
      <polygon points={f.top} fill={`url(#${id}t)`} />
      <polygon points={tapeTop} fill={t.tape} opacity="0.9" />
      <polygon points={tapeLeft} fill={t.tapeDark} opacity="0.55" />
      {label && (
        <g transform={leftFaceMatrix(6, 60, 44)}>
          <rect x="0" y="0" width="16" height="12" rx="1.5" fill="#fff" opacity="0.92" />
          <rect x="2.5" y="3" width="11" height="1.6" rx="0.8" fill="#0B2A4A" opacity="0.7" />
          <rect x="2.5" y="6.2" width="7" height="1.6" rx="0.8" fill="#0B2A4A" opacity="0.4" />
        </g>
      )}
      {label && (
        <g transform={rightFaceMatrix(60, 60, 50)} opacity="0.5">
          <path d="M40 8 l6 0 m-3 -3 l3 3 -3 3" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M40 16 l6 0 m-3 -3 l3 3 -3 3" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      )}
      <polyline points={poly([iso(0, 60, 52), iso(60, 60, 52), iso(60, 0, 52)])} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.8" />
    </svg>
  );
}

/* ----------------------------------- Truck ---------------------------------- */

export function Truck3D({ className = '', width = 320, title = 'YA² delivery truck' }: ObjProps) {
  const id = useId().replace(/:/g, '');
  const chassis = cuboid(0, 0, 9, 118, 40, 6);
  const box = cuboid(0, 0, 15, 80, 40, 48);
  const cab = cuboid(84, 3, 15, 30, 34, 26);
  const cabRoof = cuboid(84, 3, 41, 22, 34, 7);
  const bumper = cuboid(114, 2, 9, 5, 36, 10);
  const shadow = poly([iso(-8, -4, 0), iso(130, -4, 0), iso(130, 50, 0), iso(-8, 50, 0)]);
  const wheel = (x: number) => (
    <g key={x}>
      <polygon points={circleXZ(x, 40.5, 9, 9)} fill="#0A1628" />
      <polygon points={circleXZ(x, 41, 9, 5)} fill="#5D6B7A" />
      <polygon points={circleXZ(x, 41.2, 9, 2.2)} fill="#C9D6E6" />
    </g>
  );
  // Windshield on the +x face of the cab, side window on the +y face.
  const windshield = poly([iso(114.2, 7, 26), iso(114.2, 33, 26), iso(114.2, 33, 39), iso(114.2, 7, 39)]);
  const sideWindow = poly([iso(96, 37.2, 27), iso(110, 37.2, 27), iso(110, 37.2, 39), iso(96, 37.2, 39)]);
  const doorLine = poly([iso(94, 37.3, 16), iso(94, 37.3, 40)]);
  return (
    <svg className={`obj3d ${className}`} width={width} viewBox="-58 -72 184 168" {...a11y(title)}>
      <defs>
        <linearGradient id={`${id}bl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E3EAF3" />
        </linearGradient>
        <linearGradient id={`${id}br`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D2DDEA" />
          <stop offset="1" stopColor="#B7C6D8" />
        </linearGradient>
        <linearGradient id={`${id}cl`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2A82FF" />
          <stop offset="1" stopColor="#146EF5" />
        </linearGradient>
        <linearGradient id={`${id}cr`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0F57C6" />
          <stop offset="1" stopColor="#0B3F92" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9FD0FF" />
          <stop offset="0.5" stopColor="#1B3A5E" />
          <stop offset="1" stopColor="#0A1628" />
        </linearGradient>
        <filter id={`${id}f`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <polygon points={shadow} fill="#071A2F" opacity="0.28" filter={`url(#${id}f)`} />
      <polygon points={chassis.left} fill="#1C2B3F" />
      <polygon points={chassis.right} fill="#101C2C" />
      {wheel(14)}
      {wheel(34)}
      {/* cargo body */}
      <polygon points={box.left} fill={`url(#${id}bl)`} />
      <polygon points={box.right} fill={`url(#${id}br)`} />
      <polygon points={box.top} fill="#F7FAFD" />
      {/* branding on the long side */}
      <g transform={leftFaceMatrix(0, 40, 63)}>
        <rect x="0" y="38" width="80" height="4" fill="#00A878" />
        <rect x="0" y="42" width="80" height="6" fill="#146EF5" />
        <text x="8" y="26" fontFamily="Manrope Variable, Manrope, sans-serif" fontWeight="800" fontSize="17" letterSpacing="-1" fill="#0B2A4A">
          YA
          <tspan fontSize="9" dy="-7" fill="#00A878">
            2
          </tspan>
        </text>
        <text x="9" y="33" fontFamily="Manrope Variable, Manrope, sans-serif" fontWeight="700" fontSize="4" letterSpacing="0.9" fill="#5D6B7A">
          TRANSPORT · LOGISTICS
        </text>
        <path d="M52 20 h16 m-5 -5 l5 5 -5 5" stroke="#146EF5" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* rear doors hint on +x face */}
      <polyline points={poly([iso(80, 20, 17), iso(80, 20, 61)])} stroke="#9FB0C6" strokeWidth="0.6" />
      {/* cab */}
      <polygon points={cab.left} fill={`url(#${id}cl)`} />
      <polygon points={cab.right} fill={`url(#${id}cr)`} />
      <polygon points={cabRoof.left} fill="#2A82FF" />
      <polygon points={cabRoof.right} fill="#0E4CAB" />
      <polygon points={cabRoof.top} fill="#5B9BFF" />
      <polygon points={windshield} fill={`url(#${id}g)`} />
      <polygon points={sideWindow} fill={`url(#${id}g)`} />
      <polyline points={doorLine} stroke="#0B3F92" strokeWidth="0.6" />
      <polygon points={bumper.left} fill="#26374D" />
      <polygon points={bumper.right} fill="#1A283A" />
      <polygon points={bumper.top} fill="#3A4D66" />
      {/* headlight */}
      <polygon points={poly([iso(119.2, 6, 14), iso(119.2, 11, 14), iso(119.2, 11, 17), iso(119.2, 6, 17)])} fill="#FFE3A8" />
      {wheel(100)}
    </svg>
  );
}

/* ---------------------------------- Aircraft -------------------------------- */

/** Cargo aircraft seen from above at an angle, with a soft ground shadow. */
export function Plane3D({ className = '', width = 260, title = 'Air cargo aircraft', shadow = true }: ObjProps & { shadow?: boolean }) {
  const id = useId().replace(/:/g, '');
  const fuselage =
    'M34 100 C 28 92, 38 84, 60 74 L170 28 C 186 21, 200 22, 202 30 C 204 38, 194 46, 178 52 L66 100 C 50 106, 38 106, 34 100 Z';
  const wings = 'M134 56 L124 126 L113 130 L100 72 Z M128 58 L74 8 L64 11 L102 70 Z M58 90 L52 118 L45 120 L42 96 Z M54 80 L34 60 L27 62 L42 88 Z';
  const body = (
    <>
      <path d="M134 56 L124 126 L113 130 L100 72 Z" fill={`url(#${id}w)`} />
      <path d="M128 58 L74 8 L64 11 L102 70 Z" fill={`url(#${id}w2)`} />
      <path d="M58 90 L52 118 L45 120 L42 96 Z" fill="#C7D3E1" />
      <path d="M54 80 L34 60 L27 62 L42 88 Z" fill="#D6E0EB" />
      <rect x="112" y="92" width="24" height="10" rx="5" transform="rotate(-23 124 97)" fill="#8FA3BA" />
      <rect x="90" y="33" width="24" height="10" rx="5" transform="rotate(-23 102 38)" fill="#9FB1C6" />
      <path d={fuselage} fill={`url(#${id}f)`} />
      <path d="M60 74 L170 28 C 186 21, 200 22, 202 30" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="1.5" />
      <path d="M72 88 L172 46" stroke="#146EF5" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M76 93 L168 54" stroke="#00A878" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M64 84 L40 90 L24 58 L34 55 Z" fill={`url(#${id}t)`} />
      <path d="M186 28 C 192 26, 197 27, 198 30 L 190 33 Z" fill="#1B3A5E" />
    </>
  );
  return (
    <svg className={`obj3d ${className}`} width={width} viewBox="0 0 220 150" {...a11y(title)}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#E9EFF6" />
          <stop offset="1" stopColor="#B9C8DA" />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#DCE5F0" />
          <stop offset="1" stopColor="#A9BACE" />
        </linearGradient>
        <linearGradient id={`${id}w2`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#E8EEF5" />
          <stop offset="1" stopColor="#C2D0E0" />
        </linearGradient>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#267DFF" />
          <stop offset="1" stopColor="#0B3F92" />
        </linearGradient>
        <filter id={`${id}b`}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {shadow && (
        <g transform="translate(14 22)" opacity="0.2" filter={`url(#${id}b)`}>
          <path d={`${fuselage} ${wings}`} fill="#071A2F" />
        </g>
      )}
      {body}
    </svg>
  );
}

/* ------------------------------------ Pin ----------------------------------- */

export function Pin3D({ className = '', width = 56, title, tone = 'blue' }: ObjProps & { tone?: 'blue' | 'emerald' | 'gold' }) {
  const id = useId().replace(/:/g, '');
  const c = { blue: ['#5B9FFF', '#146EF5', '#0B3F92'], emerald: ['#4BE5B4', '#00A878', '#066B4D'], gold: ['#FFD28A', '#FFB547', '#C9811A'] }[tone];
  return (
    <svg className={`obj3d ${className}`} width={width} viewBox="0 0 60 80" {...a11y(title)}>
      <defs>
        <radialGradient id={`${id}p`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={c[0]} />
          <stop offset="0.6" stopColor={c[1]} />
          <stop offset="1" stopColor={c[2]} />
        </radialGradient>
        <radialGradient id={`${id}s`}>
          <stop offset="0" stopColor="#071A2F" stopOpacity="0.35" />
          <stop offset="1" stopColor="#071A2F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="74" rx="14" ry="4.5" fill={`url(#${id}s)`} />
      <path d="M30 72 C 30 72, 8 46, 8 27 A 22 22 0 0 1 52 27 C 52 46, 30 72, 30 72 Z" fill={`url(#${id}p)`} />
      <circle cx="30" cy="27" r="9" fill="#fff" />
      <circle cx="30" cy="27" r="4" fill={c[1]} />
      <path d="M17 16 A 16 16 0 0 1 30 9" stroke="#fff" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ----------------------------------- Globe ---------------------------------- */

export function Globe3D({ className = '', width = 220, title }: ObjProps) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`obj3d ${className}`} width={width} viewBox="0 0 200 200" {...a11y(title)}>
      <defs>
        <radialGradient id={`${id}g`} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#4E97FF" />
          <stop offset="0.55" stopColor="#146EF5" />
          <stop offset="1" stopColor="#071A2F" />
        </radialGradient>
        <radialGradient id={`${id}h`} cx="0.3" cy="0.25" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}c`}>
          <circle cx="100" cy="100" r="78" />
        </clipPath>
      </defs>
      <ellipse cx="100" cy="188" rx="58" ry="8" fill="#071A2F" opacity="0.18" />
      <circle cx="100" cy="100" r="78" fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}c)`} fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="1">
        <ellipse cx="100" cy="100" rx="78" ry="26" />
        <ellipse cx="100" cy="100" rx="78" ry="56" />
        <line x1="22" y1="100" x2="178" y2="100" />
        <ellipse cx="100" cy="100" rx="28" ry="78" />
        <ellipse cx="100" cy="100" rx="58" ry="78" />
        <line x1="100" y1="22" x2="100" y2="178" />
      </g>
      <circle cx="100" cy="100" r="78" fill={`url(#${id}h)`} />
      <path className="globe-route" d="M48 120 Q 92 34 150 76" fill="none" stroke="#2FE0A7" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 7" />
      <path className="globe-route" d="M62 150 Q 120 118 156 132" fill="none" stroke="#FFB547" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 7" />
      <circle cx="48" cy="120" r="5" fill="#2FE0A7" />
      <circle cx="150" cy="76" r="5" fill="#fff" />
      <circle cx="62" cy="150" r="4" fill="#FFB547" />
      <circle cx="156" cy="132" r="4" fill="#fff" />
      <ellipse cx="100" cy="100" rx="96" ry="30" fill="none" stroke="#7FB2FF" strokeOpacity="0.5" strokeWidth="1.2" transform="rotate(-18 100 100)" />
    </svg>
  );
}

/* --------------------------------- 3D arrow --------------------------------- */

/** Extruded "forward" arrow — the YA² motion motif in 3D. */
export function Arrow3D({ className = '', width = 120, title, tone = 'emerald' }: ObjProps & { tone?: 'emerald' | 'blue' }) {
  const id = useId().replace(/:/g, '');
  const c = tone === 'emerald' ? ['#4BE5B4', '#00A878', '#056347'] : ['#6FA8FF', '#146EF5', '#0B3F92'];
  // 2D arrow in the x–y ground plane, extruded up by h.
  const shape: [number, number][] = (
    [
      [0, 14], [44, 14], [44, 0], [74, 24], [44, 48], [44, 34], [0, 34],
    ] as [number, number][]
  ).map(([x, y]) => [48 - y, 74 - x]); // point the arrow along −y (screen up-right)
  const h = 14;
  const top = poly(shape.map(([x, y]) => iso(x, y, h)));
  const sides: { pts: string; shade: string }[] = [];
  for (let i = 0; i < shape.length; i++) {
    const [x1, y1] = shape[i];
    const [x2, y2] = shape[(i + 1) % shape.length];
    const nx = y2 - y1;
    const ny = -(x2 - x1);
    // (nx, ny) is the outward normal; only faces turned towards the viewer (+x/+y) are drawn.
    if (nx + ny <= 0) continue;
    sides.push({
      pts: poly([iso(x1, y1, 0), iso(x2, y2, 0), iso(x2, y2, h), iso(x1, y1, h)]),
      shade: ny > nx ? c[1] : c[2],
    });
  }
  return (
    <svg className={`obj3d ${className}`} width={width} viewBox="-70 -14 112 86" {...a11y(title)}>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c[0]} />
          <stop offset="1" stopColor={c[1]} />
        </linearGradient>
      </defs>
      {sides.map((s, i) => (
        <polygon key={i} points={s.pts} fill={s.shade} />
      ))}
      <polygon points={top} fill={`url(#${id}t)`} />
    </svg>
  );
}

/* ------------------------------- Pallet stack ------------------------------- */

export function PalletStack({ className = '', width = 200, title }: ObjProps) {
  const id = useId().replace(/:/g, '');
  const pallet = cuboid(0, 0, 0, 84, 84, 8);
  const boxes: [number, number, number, number, number, number, string][] = [
    [2, 2, 8, 40, 40, 34, 'k'],
    [44, 2, 8, 38, 40, 34, 'k'],
    [2, 44, 8, 40, 38, 34, 'w'],
    [44, 44, 8, 38, 38, 34, 'k'],
    [10, 10, 42, 36, 36, 28, 'b'],
    [48, 26, 42, 30, 32, 24, 'k'],
  ];
  const tones: Record<string, [string, string, string]> = {
    k: ['#EFC58B', '#D39A56', '#B27436'],
    w: ['#FFFFFF', '#DCE5F0', '#B9C8DA'],
    b: ['#5B9BFF', '#1E6FEF', '#0F4CAB'],
  };
  return (
    <svg className={`obj3d ${className}`} width={width} viewBox="-80 -84 164 138" {...a11y(title)}>
      <defs>
        <filter id={`${id}f`}>
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <polygon points={circleXY(48, 48, 0, 62)} fill="#071A2F" opacity="0.2" filter={`url(#${id}f)`} />
      <polygon points={pallet.left} fill="#8C6A43" />
      <polygon points={pallet.right} fill="#6E5234" />
      <polygon points={pallet.top} fill="#B48A5A" />
      {boxes.map(([x, y, z, w, d, h, t], i) => {
        const f = cuboid(x, y, z, w, d, h);
        const [top, left, right] = tones[t];
        return (
          <g key={i}>
            <polygon points={f.left} fill={left} />
            <polygon points={f.right} fill={right} />
            <polygon points={f.top} fill={top} />
            <polygon points={poly([iso(x + w / 2 - 3, y, z + h), iso(x + w / 2 + 3, y, z + h), iso(x + w / 2 + 3, y + d, z + h), iso(x + w / 2 - 3, y + d, z + h)])} fill="#fff" opacity="0.28" />
          </g>
        );
      })}
    </svg>
  );
}
