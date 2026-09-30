/**
 * Tiny isometric projection kit used to draw the YA² 3D objects as crisp,
 * lightweight SVG (no WebGL needed).
 *
 * World axes: +x → screen right-down, +y → screen left-down, +z → up.
 * Faces with normals +x (right), +y (left) and +z (top) are visible.
 */
const C = Math.cos(Math.PI / 6);
const S = 0.5;

export type Pt = [number, number];

export function iso(x: number, y: number, z: number): Pt {
  return [(x - y) * C, (x + y) * S - z];
}

export const poly = (pts: Pt[]) => pts.map(([a, b]) => `${a.toFixed(2)},${b.toFixed(2)}`).join(' ');
export const pathOf = (pts: Pt[]) => `M${poly(pts).replace(/ /g, ' L')} Z`;

export interface CuboidFaces {
  top: string;
  left: string; // +y face
  right: string; // +x face
}

export function cuboid(x: number, y: number, z: number, w: number, d: number, h: number): CuboidFaces {
  const t = z + h;
  return {
    top: poly([iso(x, y, t), iso(x + w, y, t), iso(x + w, y + d, t), iso(x, y + d, t)]),
    left: poly([iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, t), iso(x, y + d, t)]),
    right: poly([iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, t), iso(x + w, y, t)]),
  };
}

/** A circle standing in the x–z plane (e.g. a wheel on the +y side). */
export function circleXZ(cx: number, y: number, cz: number, r: number, n = 28): string {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(iso(cx + r * Math.cos(a), y, cz + r * Math.sin(a)));
  }
  return poly(pts);
}

/** A circle lying flat on the ground plane (z constant). */
export function circleXY(cx: number, cy: number, z: number, r: number, n = 32): string {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(iso(cx + r * Math.cos(a), cy + r * Math.sin(a), z));
  }
  return poly(pts);
}

/** SVG matrix that maps flat 2D artwork (u → +x, v → −z) onto the +y face plane. */
export function leftFaceMatrix(x: number, y: number, z: number): string {
  const [tx, ty] = iso(x, y, z);
  return `matrix(${C} ${S} 0 1 ${tx} ${ty})`;
}

/** SVG matrix mapping 2D artwork (u → −y, v → −z) onto the +x face plane. */
export function rightFaceMatrix(x: number, y: number, z: number): string {
  const [tx, ty] = iso(x, y, z);
  return `matrix(${C} ${-S} 0 1 ${tx} ${ty})`;
}
