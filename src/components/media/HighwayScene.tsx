import { useEffect, useRef } from 'react';

/**
 * Cinematic night-highway loop rendered on a canvas — a lightweight stand-in
 * for background footage. Perspective-correct 3D: lanes, streetlamps and
 * vehicles are placed in metres and projected through a camera, with
 * long-exposure light trails, haze, a city skyline and film grain.
 *
 * Traffic keeps left (India): tail-lights ahead on our carriageway,
 * oncoming headlights across the median on the right.
 */

type Veh = { x: number; z: number; v: number; w: number; h: number; truck: boolean; oncoming: boolean };

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CAM_H = 1.5; // camera height (m)
const CAM_SPEED = 24; // our speed (m/s)
const FAR = 420;
const OUR_LANES = [-3.5, 0, 3.5];
const ONCOMING_LANES = [9.2, 12.7, 16.2];
const MEDIAN = [5.25, 7.45];

export function HighwayScene({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = rng(20260930);

    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let last = performance.now();
    let t = 0;

    // --- static layers -------------------------------------------------------
    const grain = document.createElement('canvas');
    grain.width = grain.height = 192;
    {
      const g = grain.getContext('2d')!;
      const img = g.createImageData(192, 192);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    }

    const grainPattern = ctx.createPattern(grain, 'repeat')!;

    // Skyline: buildings as [x0, x1, height] in 0..1 screen-width units, windows as points.
    const buildings: { x: number; w: number; h: number; lit: { x: number; y: number; p: number }[] }[] = [];
    {
      let x = -0.02;
      while (x < 1.02) {
        const w = 0.012 + rand() * 0.035;
        const tall = rand() < 0.12;
        const h = (tall ? 0.09 : 0.025) + rand() * (tall ? 0.08 : 0.05);
        const lit: { x: number; y: number; p: number }[] = [];
        const n = Math.floor(w * h * 9000 * (0.3 + rand() * 0.5));
        for (let i = 0; i < n; i++) lit.push({ x: rand(), y: rand(), p: rand() * 6.28 });
        buildings.push({ x, w, h, lit });
        x += w + rand() * 0.006;
      }
    }

    // Traffic
    const vehicles: Veh[] = [];
    const spawn = (oncoming: boolean, z?: number): Veh => {
      const truck = rand() < (oncoming ? 0.35 : 0.45);
      const lanes = oncoming ? ONCOMING_LANES : OUR_LANES;
      let x = lanes[Math.floor(rand() * lanes.length)] + (rand() - 0.5) * 0.6;
      if (!oncoming && Math.abs(x) < 1.2) x += 3.5; // keep our own lane clear just ahead
      return {
        x,
        z: z ?? (oncoming ? FAR : 20 + rand() * FAR),
        // relative speed along z (m/s): oncoming close fast, same-direction drift slowly
        v: oncoming ? -(CAM_SPEED + 18 + rand() * 12) : (rand() - 0.55) * 9,
        w: truck ? 2.3 : 1.55,
        h: truck ? 1.25 : 0.8,
        truck,
        oncoming,
      };
    };
    for (let i = 0; i < 30; i++) vehicles.push(spawn(true, 15 + rand() * FAR));
    for (let i = 0; i < 30; i++) vehicles.push(spawn(false));

    // --- projection ----------------------------------------------------------
    let vpx = 0;
    let hy = 0;
    let F = 0;
    const P = (x: number, y: number, z: number): [number, number] => [vpx + (x / z) * F, hy + ((CAM_H - y) / z) * F];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const glow = (x: number, y: number, r: number, color: string, a: number) => {
      if (r < 0.3) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${color},${a})`);
      g.addColorStop(0.25, `rgba(${color},${a * 0.45})`);
      g.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };

    /** Wet-asphalt reflection: a soft vertical streak below a light source. */
    const reflect = (x: number, y: number, len: number, wid: number, color: string, a: number) => {
      if (len < 1 || a <= 0) return;
      const g = ctx.createLinearGradient(x, y, x, y + len);
      g.addColorStop(0, `rgba(${color},${a})`);
      g.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - wid / 2, y, wid, len);
    };

    const quad = (a: [number, number], b: [number, number], c: [number, number], d: [number, number]) => {
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(d[0], d[1]);
      ctx.closePath();
      ctx.fill();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce) t += dt;

      const narrow = W < 700 * dpr;
      vpx = W * (narrow ? 0.5 : 0.63) + Math.sin(t * 0.21) * W * 0.004;
      hy = H * 0.5 + Math.sin(t * 0.37) * H * 0.002;
      F = H * (narrow ? 0.95 : 1.1);

      // Sky
      ctx.globalCompositeOperation = 'source-over';
      const sky = ctx.createLinearGradient(0, 0, 0, hy);
      sky.addColorStop(0, '#050c19');
      sky.addColorStop(0.45, '#0e2342');
      sky.addColorStop(0.78, '#28436b');
      sky.addColorStop(0.93, '#6b5a6e');
      sky.addColorStop(1, '#b8764e');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, hy + 2);

      // Warm city glow on horizon
      ctx.globalCompositeOperation = 'lighter';
      glow(vpx - W * 0.1, hy, W * 0.6, '255,140,70', 0.22);
      glow(vpx + W * 0.25, hy, W * 0.35, '80,140,255', 0.08);

      // Stars
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 70; i++) {
        const sx = ((i * 7919) % 1000) / 1000;
        const sy = ((i * 104729) % 1000) / 1000;
        ctx.fillStyle = `rgba(210,225,255,${0.12 + 0.18 * Math.abs(Math.sin(t * 0.8 + i))})`;
        ctx.fillRect(sx * W, sy * hy * 0.7, dpr, dpr);
      }

      // Cargo aircraft crossing with strobe + beacon
      {
        const cycle = 38;
        const p = ((t + 6) % cycle) / cycle;
        const ax = W * (1.05 - p * 1.2);
        const ay = hy * (0.22 + p * 0.1);
        ctx.strokeStyle = 'rgba(180,200,235,0.06)';
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(ax + W * 0.02, ay - hy * 0.004);
        ctx.lineTo(ax + W * 0.22, ay - hy * 0.03);
        ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        if (Math.sin(t * 9) > 0.85) glow(ax, ay, 9 * dpr, '255,255,255', 0.95);
        if (Math.sin(t * 4 + 1) > 0.6) glow(ax + 5 * dpr, ay + 1.5 * dpr, 6 * dpr, '255,60,60', 0.8);
        glow(ax, ay, 2.5 * dpr, '255,240,220', 0.7);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Skyline
      ctx.fillStyle = '#131c2c';
      for (const b of buildings) {
        const bx = b.x * W;
        const bw = b.w * W;
        const bh = b.h * H * 0.42;
        ctx.fillRect(bx, hy - bh, bw, bh + 1);
      }
      ctx.globalCompositeOperation = 'lighter';
      for (const b of buildings) {
        const bx = b.x * W;
        const bw = b.w * W;
        const bh = b.h * H * 0.42;
        for (const l of b.lit) {
          const a = 0.35 + 0.35 * Math.sin(t * 0.3 + l.p);
          ctx.fillStyle = `rgba(255,${190 + ((l.p * 20) | 0)},120,${a * 0.7})`;
          ctx.fillRect(bx + l.x * (bw - 2 * dpr), hy - bh + 2 * dpr + l.y * (bh - 4 * dpr), 1.2 * dpr, 1.2 * dpr);
        }
      }
      // Tower beacons
      for (let i = 0; i < buildings.length; i += 9) {
        const b = buildings[i];
        if (b.h < 0.09) continue;
        if (Math.sin(t * 2 + i) > 0.2) glow(b.x * W + b.w * W * 0.5, hy - b.h * H * 0.42, 5 * dpr, '255,50,50', 0.7);
      }
      ctx.globalCompositeOperation = 'source-over';

      // Ground (beyond road) & road
      const ground = ctx.createLinearGradient(0, hy, 0, H);
      ground.addColorStop(0, '#121824');
      ground.addColorStop(1, '#05080d');
      ctx.fillStyle = ground;
      ctx.fillRect(0, hy, W, H - hy);

      const zn = 1.2;
      const road = ctx.createLinearGradient(0, hy, 0, H);
      road.addColorStop(0, '#3a3a44');
      road.addColorStop(0.12, '#20232c');
      road.addColorStop(1, '#0d1016');
      ctx.fillStyle = road;
      quad(P(-5.6, 0, zn), P(18.2, 0, zn), P(18.2, 0, FAR), P(-5.6, 0, FAR));

      // Median barrier + shrubs
      ctx.fillStyle = '#1b2029';
      quad(P(MEDIAN[0], 0, zn), P(MEDIAN[1], 0, zn), P(MEDIAN[1], 0, FAR), P(MEDIAN[0], 0, FAR));
      ctx.fillStyle = '#0c1210';
      quad(P(MEDIAN[0] + 0.3, 0.9, zn), P(MEDIAN[1] - 0.3, 0.9, zn), P(MEDIAN[1] - 0.3, 0.9, FAR), P(MEDIAN[0] + 0.3, 0.9, FAR));

      // Lamp light pools on the road
      const lampGap = 42;
      const lampOff = (t * CAM_SPEED) % lampGap;
      ctx.globalCompositeOperation = 'lighter';
      for (let z = lampGap - lampOff; z < FAR; z += lampGap) {
        for (const side of [6.35, -6.6]) {
          const [cx, cy] = P(side * 0.55, 0, z);
          const r = (9 / z) * F;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(1, 0.22);
          glow(0, 0, r, '255,160,70', Math.min(0.22, 5 / z + 0.04));
          ctx.restore();
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      // Lane markings
      const dash = 3;
      const gap = 9;
      const off = (t * CAM_SPEED) % (dash + gap);
      ctx.fillStyle = 'rgba(225,230,240,0.55)';
      for (const lx of [-1.75, 1.75, 10.95, 14.45]) {
        for (let z = dash + gap - off; z < 160; z += dash + gap) {
          const z0 = Math.max(zn, z);
          const z1 = z + dash;
          quad(P(lx - 0.08, 0, z0), P(lx + 0.08, 0, z0), P(lx + 0.08, 0, z1), P(lx - 0.08, 0, z1));
        }
      }
      ctx.fillStyle = 'rgba(230,200,120,0.5)';
      for (const lx of [-5.25, MEDIAN[0] - 0.1, MEDIAN[1] + 0.1, 17.8]) {
        quad(P(lx - 0.07, 0, zn), P(lx + 0.07, 0, zn), P(lx + 0.07, 0, FAR * 0.6), P(lx - 0.07, 0, FAR * 0.6));
      }

      // Streetlamps (poles + heads)
      for (let z = lampGap - lampOff + lampGap * 6; z >= lampGap - lampOff; z -= lampGap) {
        for (const side of [6.35, -6.6]) {
          if (z < 2) continue;
          const base = P(side, 0, z);
          const top = P(side, 10, z);
          const arm = P(side + (side > 0 ? -1.8 : 1.8), 10, z);
          ctx.strokeStyle = 'rgba(20,24,32,0.95)';
          ctx.lineWidth = Math.max(1, (0.22 / z) * F);
          ctx.beginPath();
          ctx.moveTo(base[0], base[1]);
          ctx.lineTo(top[0], top[1]);
          ctx.lineTo(arm[0], arm[1]);
          ctx.stroke();
          ctx.globalCompositeOperation = 'lighter';
          glow(arm[0], arm[1] + (0.2 / z) * F, (3.2 / z) * F + 3 * dpr, '255,170,80', Math.min(0.9, 0.25 + 18 / z));
          const [gx, gy] = P(side + (side > 0 ? -1.8 : 1.8), 0, z);
          reflect(gx, gy, (6 / z) * F, (0.9 / z) * F + dpr, '255,160,70', Math.min(0.28, 6 / z));
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      // Vehicles (far → near)
      for (const v of vehicles) {
        v.z += v.v * dt;
        if (v.oncoming && v.z < 1.5) Object.assign(v, spawn(true));
        if (!v.oncoming && (v.z < 6 || v.z > FAR)) Object.assign(v, spawn(false, v.z < 6 ? FAR * (0.4 + rand() * 0.6) : 30 + rand() * 60));
      }
      vehicles.sort((a, b) => b.z - a.z);
      for (const v of vehicles) {
        const z = v.z;
        const fade = Math.min(1, (FAR - z) / 80);
        if (fade <= 0) continue;
        const half = v.w / 2;
        const [lx, ly] = P(v.x - half + 0.2, v.h * 0.55, z);
        const [rx, ry] = P(v.x + half - 0.2, v.h * 0.55, z);
        const s = Math.max(1.2 * dpr, (0.28 / z) * F);

        // body silhouette
        const [bx0, by0] = P(v.x - half, v.truck ? 3.4 : 1.45, z);
        const [bx1, by1] = P(v.x + half, 0.25, z);
        ctx.fillStyle = `rgba(${v.truck ? '22,26,34' : '10,13,19'},${0.92 * fade})`;
        ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
        if (v.truck && !v.oncoming && z < 160) {
          // red/white retro-reflective tape on the tailgate, lit by our headlights
          const [, ty] = P(v.x, 0.95, z);
          const th = Math.max(1, (0.12 / z) * F);
          const seg = (bx1 - bx0) / 8;
          for (let k = 0; k < 8; k++) {
            ctx.fillStyle = k % 2 ? `rgba(240,240,235,${0.55 * fade})` : `rgba(220,40,40,${0.6 * fade})`;
            ctx.fillRect(bx0 + k * seg, ty, seg, th);
          }
        }

        ctx.globalCompositeOperation = 'lighter';
        if (v.oncoming) {
          // long-exposure headlight streaks toward the camera
          const trail = Math.min(26, z * 0.5);
          for (const [px, py, sx] of [
            [lx, ly, v.x - half + 0.2],
            [rx, ry, v.x + half - 0.2],
          ] as const) {
            const [tx, ty] = P(sx, v.h * 0.55, z + trail);
            const g = ctx.createLinearGradient(px, py, tx, ty);
            g.addColorStop(0, `rgba(255,244,225,${0.55 * fade})`);
            g.addColorStop(1, 'rgba(255,244,225,0)');
            ctx.strokeStyle = g;
            ctx.lineWidth = s * 0.9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(tx, ty);
            ctx.stroke();
            glow(px, py, s * 4.5, '255,240,215', 0.85 * fade);
            reflect(px, py + (v.h * 0.55 / z) * F, (2.6 / z) * F, s * 1.4, '255,236,205', 0.35 * fade);
          }
          if (z < 40) glow((lx + rx) / 2, ly, (F / z) * 1.6, '255,235,200', Math.min(0.25, 3 / z)); // glare
          const [rl, rr] = [ly, ry];
          ctx.save();
          ctx.translate((lx + rx) / 2, (rl + rr) / 2 + (v.h * 0.55 / z) * F * 1.6);
          ctx.scale(1, 0.18);
          glow(0, 0, (3.5 / z) * F, '255,235,200', Math.min(0.3, 4 / z) * fade); // reflection on asphalt
          ctx.restore();
        } else {
          reflect(lx, ly + (v.h * 0.55 / z) * F, (2 / z) * F, s * 1.2, '255,50,40', 0.35 * fade);
          reflect(rx, ry + (v.h * 0.55 / z) * F, (2 / z) * F, s * 1.2, '255,50,40', 0.35 * fade);
          glow(lx, ly, s * 3.2, '255,40,30', 0.8 * fade);
          glow(rx, ry, s * 3.2, '255,40,30', 0.8 * fade);
          ctx.fillStyle = `rgba(255,120,110,${0.9 * fade})`;
          ctx.fillRect(lx - s * 0.5, ly - s * 0.35, s, s * 0.7);
          ctx.fillRect(rx - s * 0.5, ry - s * 0.35, s, s * 0.7);
          if (v.truck) {
            const [ax0, ay0] = P(v.x - half, 3.3, z);
            const [ax1] = P(v.x + half, 3.3, z);
            glow(ax0, ay0, s * 2, '255,170,40', 0.6 * fade);
            glow(ax1, ay0, s * 2, '255,170,40', 0.6 * fade);
          }
          ctx.save();
          ctx.translate((lx + rx) / 2, ly + (v.h * 0.55 / z) * F * 1.7);
          ctx.scale(1, 0.15);
          glow(0, 0, (2.2 / z) * F, '255,40,30', Math.min(0.25, 3 / z) * fade);
          ctx.restore();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      // Horizon haze
      const haze = ctx.createLinearGradient(0, hy - H * 0.08, 0, hy + H * 0.08);
      haze.addColorStop(0, 'rgba(60,70,95,0)');
      haze.addColorStop(0.5, 'rgba(70,75,100,0.22)');
      haze.addColorStop(1, 'rgba(60,70,95,0)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, hy - H * 0.08, W, H * 0.16);

      // Grade: teal shadows / warm highlights, vignette, grain
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(20,90,160,0.25)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      const vig = ctx.createRadialGradient(vpx, H * 0.55, H * 0.2, vpx, H * 0.55, Math.max(W, H) * 0.8);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.035;
      ctx.save();
      ctx.translate(-Math.random() * 192, -Math.random() * 192);
      ctx.fillStyle = grainPattern;
      ctx.fillRect(0, 0, W + 192, H + 192);
      ctx.restore();
      ctx.globalAlpha = 1;

      if (running && !reduce) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()));
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);

    // Advance the simulation a little so the first frame already shows traffic.
    t = 3;
    raf = requestAnimationFrame(frame);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} className={`highway-scene ${className}`} aria-hidden />;
}
