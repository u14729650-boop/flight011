import { INDIA_MAP_PROJECTION } from '../data/indiaMap.generated';

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km between two [lat, lon] points. */
export function haversineKm(a: [number, number], b: [number, number]): number {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Projects [lat, lon] into the India map SVG coordinate space (Mercator). */
export function project([lat, lon]: [number, number]): [number, number] {
  const { scale, tx, ty } = INDIA_MAP_PROJECTION;
  const x = tx + scale * rad(lon);
  const y = ty - scale * Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2));
  return [x, y];
}

/** Quadratic curve between two projected points, bowed to one side. */
export function arcPath(a: [number, number], b: [number, number], bend = 0.22): string {
  const [x1, y1] = a;
  const [x2, y2] = b;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}
