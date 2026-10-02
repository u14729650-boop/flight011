/**
 * Tileable 3D noise for the volumetric clouds, packed into one RGBA voxel
 * texture (generated once, on the CPU):
 *   R  Perlin–Worley "shape" noise — billowy cumulus forms
 *   G  Worley fBm at a higher frequency — erodes the edges into wisps
 * Technique after Schneider, "The Real-time Volumetric Cloudscapes of
 * Horizon Zero Dawn" (SIGGRAPH 2015).
 */

function makeRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/** Lets the browser paint between slices so generation never freezes the page. */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

/** Tileable value-noise fBm (period N on every axis). */
async function valueFbm(N: number, freqs: number[], rnd: () => number): Promise<Float32Array> {
  const out = new Float32Array(N * N * N);
  let total = 0;
  for (let oi = 0; oi < freqs.length; oi++) {
    const f = freqs[oi];
    const amp = 1 / (1 << oi);
    total += amp;
    const lat = new Float32Array(f * f * f).map(() => rnd());
    const L = (x: number, y: number, z: number) => lat[((z % f) * f + (y % f)) * f + (x % f)];
    const sm = (t: number) => t * t * (3 - 2 * t);
    for (let z = 0; z < N; z++) {
      if (z % 8 === 7) await tick();
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          const fx = (x / N) * f, fy = (y / N) * f, fz = (z / N) * f;
          const x0 = Math.floor(fx), y0 = Math.floor(fy), z0 = Math.floor(fz);
          const tx = sm(fx - x0), ty = sm(fy - y0), tz = sm(fz - z0);
          const c00 = L(x0, y0, z0) + (L(x0 + 1, y0, z0) - L(x0, y0, z0)) * tx;
          const c10 = L(x0, y0 + 1, z0) + (L(x0 + 1, y0 + 1, z0) - L(x0, y0 + 1, z0)) * tx;
          const c01 = L(x0, y0, z0 + 1) + (L(x0 + 1, y0, z0 + 1) - L(x0, y0, z0 + 1)) * tx;
          const c11 = L(x0, y0 + 1, z0 + 1) + (L(x0 + 1, y0 + 1, z0 + 1) - L(x0, y0 + 1, z0 + 1)) * tx;
          const c0 = c00 + (c10 - c00) * ty, c1 = c01 + (c11 - c01) * ty;
          out[(z * N + y) * N + x] += (c0 + (c1 - c0) * tz) * amp;
        }
    }
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

/** Tileable inverted Worley (cellular) noise: 1 at feature points, 0 between cells. */
async function worley(N: number, cells: number, rnd: () => number): Promise<Float32Array> {
  const pts = new Float32Array(cells * cells * cells * 3).map(() => rnd());
  const out = new Float32Array(N * N * N);
  const cs = N / cells;
  for (let z = 0; z < N; z++) {
    if (z % 6 === 5) await tick();
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const px = x / cs, py = y / cs, pz = z / cs;
        const cx = Math.floor(px), cy = Math.floor(py), cz = Math.floor(pz);
        let best = 9;
        for (let dz = -1; dz <= 1; dz++)
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const ix = cx + dx, iy = cy + dy, iz = cz + dz;
              const w = (((iz % cells) + cells) % cells * cells + (((iy % cells) + cells) % cells)) * cells + (((ix % cells) + cells) % cells);
              const qx = ix + pts[w * 3] - px, qy = iy + pts[w * 3 + 1] - py, qz = iz + pts[w * 3 + 2] - pz;
              const d = qx * qx + qy * qy + qz * qz;
              if (d < best) best = d;
            }
        out[(z * N + y) * N + x] = 1 - Math.min(1, Math.sqrt(best));
      }
  }
  return out;
}

const remap = (v: number, lo: number, hi: number, a: number, b: number) => a + ((v - lo) / (hi - lo)) * (b - a);

export async function buildCloudNoise(N = 48): Promise<Uint8Array> {
  const rnd = makeRng(1337);
  const perlin = await valueFbm(N, [4, 8, 16], rnd);
  const w1 = await worley(N, 4, rnd), w2 = await worley(N, 8, rnd), w3 = await worley(N, 16, rnd);
  const d1 = await worley(N, 8, rnd), d2 = await worley(N, 16, rnd), d3 = await worley(N, 24, rnd);
  const data = new Uint8Array(N * N * N * 4);
  for (let i = 0; i < N * N * N; i++) {
    const wf = w1[i] * 0.625 + w2[i] * 0.25 + w3[i] * 0.125;
    const shape = Math.min(1, Math.max(0, remap(perlin[i], wf - 1, 1, 0, 1)));
    const detail = d1[i] * 0.625 + d2[i] * 0.25 + d3[i] * 0.125;
    data[i * 4] = Math.round(shape * 255);
    data[i * 4 + 1] = Math.round(detail * 255);
    data[i * 4 + 2] = Math.round(wf * 255);
    data[i * 4 + 3] = 255;
  }
  return data;
}
