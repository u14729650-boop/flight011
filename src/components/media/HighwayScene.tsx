import { useEffect, useRef, type MutableRefObject } from 'react';

/**
 * Cinematic night-highway scene rendered on a canvas. Driven by a 0–1
 * `progress` ref (scroll position): every frame is a pure function of the
 * distance travelled, so scrolling back plays the scene in reverse.
 *
 * Perspective-correct 3D in metres. Traffic keeps left (India): tail-lights
 * ahead on our carriageway, oncoming headlights across the median.
 * The YA² truck ahead of us is the "hero" vehicle we catch up with.
 */

interface Veh {
  x: number;
  z0: number;
  v: number;
  w: number;
  h: number;
  truck: boolean;
  oncoming: boolean;
  hero?: boolean;
}

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
const DRIVE = 1400; // metres travelled over the full scroll
const FAR = 420;
const NEAR = 6;
const OUR_LANES = [-3.5, 3.5];
const ONCOMING_LANES = [9.2, 12.7, 16.2];
const MEDIAN = [5.25, 7.45];
const HERO_LANE = 0; // the YA² truck drives ahead of us in our lane

const mod = (a: number, n: number) => ((a % n) + n) % n;

export function HighwayScene({ className = '', progress }: { className?: string; progress?: MutableRefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const rand = rng(20260930);

    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let running = false;
    let last = performance.now();
    let clock = 0; // ambient time (twinkle, strobes)
    let p = progress?.current ?? 0; // eased scroll progress
    let pPrev = p;

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

    const vehicles: Veh[] = [];
    const make = (oncoming: boolean): Veh => {
      const truck = rand() < (oncoming ? 0.35 : 0.5);
      const lanes = oncoming ? ONCOMING_LANES : OUR_LANES;
      return {
        x: lanes[Math.floor(rand() * lanes.length)] + (rand() - 0.5) * 0.5,
        z0: rand() * FAR,
        v: oncoming ? -(CAM_SPEED + 18 + rand() * 12) : (rand() - 0.6) * 8,
        w: truck ? 2.3 : 1.6,
        h: truck ? 1.25 : 0.8,
        truck,
        oncoming,
      };
    };
    for (let i = 0; i < 32; i++) vehicles.push(make(true));
    for (let i = 0; i < 26; i++) {
      const v = make(false);
      if (Math.abs(v.x - HERO_LANE) < 1 && v.z0 < 90) v.z0 += 90; // keep the lane behind the YA² truck clear
      vehicles.push(v);
    }
    const hero: Veh = { x: HERO_LANE, z0: 0, v: 0, w: 2.5, h: 1.2, truck: true, oncoming: false, hero: true };

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
      draw(0);
    };

    const glow = (x: number, y: number, r: number, color: string, a: number) => {
      if (r < 0.3 || a <= 0) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${color},${a})`);
      g.addColorStop(0.25, `rgba(${color},${a * 0.45})`);
      g.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    const reflect = (x: number, y: number, len: number, wid: number, color: string, a: number) => {
      if (len < 1 || a <= 0) return;
      len = Math.min(len, H * 0.18);
      wid = Math.min(wid, 14 * dpr);
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

    /** Detailed rear of the YA² truck. */
    const drawHeroTruck = (z: number, speedBlur: number) => {
      const half = hero.w / 2;
      const [x0, yTop] = P(hero.x - half, 3.7, z);
      const [x1, yBot] = P(hero.x + half, 0.55, z);
      const bw = x1 - x0;
      const bh = yBot - yTop;
      // chassis + wheels shadow
      const [, yGround] = P(hero.x, 0, z);
      ctx.fillStyle = 'rgba(4,6,10,0.95)';
      ctx.fillRect(x0 + bw * 0.05, yBot, bw * 0.9, yGround - yBot);
      // container: lit by our headlights (brighter at the bottom)
      const body = ctx.createLinearGradient(0, yTop, 0, yBot);
      body.addColorStop(0, '#39414f');
      body.addColorStop(0.55, '#8d97a6');
      body.addColorStop(1, '#c9d0da');
      ctx.fillStyle = body;
      ctx.fillRect(x0, yTop, bw, bh);
      // door seam + hinges
      ctx.fillStyle = 'rgba(20,25,34,0.55)';
      ctx.fillRect(x0 + bw / 2 - Math.max(1, bw * 0.004), yTop, Math.max(1.5, bw * 0.008), bh);
      for (const fy of [0.18, 0.5, 0.82]) {
        ctx.fillRect(x0 + bw * 0.03, yTop + bh * fy, bw * 0.05, Math.max(1, bh * 0.02));
        ctx.fillRect(x1 - bw * 0.08, yTop + bh * fy, bw * 0.05, Math.max(1, bh * 0.02));
      }
      // brand stripe + logo
      ctx.fillStyle = '#00a878';
      ctx.fillRect(x0, yTop + bh * 0.08, bw, bh * 0.03);
      ctx.fillStyle = '#146ef5';
      ctx.fillRect(x0, yTop + bh * 0.11, bw, bh * 0.05);
      const fs = bh * 0.2;
      if (fs > 5) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#0b2a4a';
        ctx.font = `800 ${fs}px "Manrope Variable", Manrope, system-ui, sans-serif`;
        const cx = x0 + bw / 2;
        const ly = yTop + bh * 0.47;
        ctx.fillText('YA', cx - fs * 0.12, ly);
        ctx.fillStyle = '#00a878';
        ctx.font = `800 ${fs * 0.5}px "Manrope Variable", Manrope, system-ui, sans-serif`;
        ctx.fillText('2', cx + fs * 0.62, ly - fs * 0.45);
        if (fs > 16) {
          ctx.fillStyle = 'rgba(11,42,74,0.75)';
          ctx.font = `700 ${fs * 0.16}px "Manrope Variable", Manrope, system-ui, sans-serif`;
          ctx.fillText('TRANSPORT  ·  LOGISTICS', cx, ly + fs * 0.32);
        }
      }
      // retro-reflective tape
      const seg = bw / 10;
      for (let k = 0; k < 10; k++) {
        ctx.fillStyle = k % 2 ? 'rgba(245,245,240,0.9)' : 'rgba(215,35,35,0.95)';
        ctx.fillRect(x0 + k * seg, yBot - bh * 0.07, seg, bh * 0.04);
      }
      // bumper, yellow commercial plate, tail lights
      ctx.fillStyle = '#12161d';
      ctx.fillRect(x0 - bw * 0.02, yBot, bw * 1.04, bh * 0.06);
      const pw = bw * 0.26;
      const ph = bh * 0.085;
      ctx.fillStyle = '#f2c230';
      ctx.fillRect(x0 + bw / 2 - pw / 2, yBot + bh * 0.075, pw, ph);
      if (ph > 7) {
        ctx.fillStyle = '#111';
        let pf = ph * 0.62;
        ctx.font = `800 ${pf}px "Manrope Variable", Manrope, system-ui, sans-serif`;
        const mw = ctx.measureText('GJ 01 YA 2026').width;
        if (mw > pw * 0.9) {
          pf *= (pw * 0.9) / mw;
          ctx.font = `800 ${pf}px "Manrope Variable", Manrope, system-ui, sans-serif`;
        }
        ctx.textBaseline = 'middle';
        ctx.fillText('GJ 01 YA 2026', x0 + bw / 2, yBot + bh * 0.075 + ph / 2 + 1);
        ctx.textBaseline = 'alphabetic';
      }
      const s = Math.max(2 * dpr, bw * 0.05);
      ctx.globalCompositeOperation = 'lighter';
      for (const tx of [x0 + bw * 0.08, x1 - bw * 0.08]) {
        glow(tx, yBot + bh * 0.03, s * 3.2, '255,40,30', 0.9);
        reflect(tx, yGround, (3 / z) * F, s * 1.2, '255,50,40', 0.35);
      }
      glow(x0 + 2, yTop + 2, s * 1.6, '255,170,40', 0.7);
      glow(x1 - 2, yTop + 2, s * 1.6, '255,170,40', 0.7);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,90,80,0.95)';
      ctx.fillRect(x0 + bw * 0.03, yBot + bh * 0.005, bw * 0.1, bh * 0.05);
      ctx.fillRect(x1 - bw * 0.13, yBot + bh * 0.005, bw * 0.1, bh * 0.05);
      // light motion blur while scrolling fast
      if (speedBlur > 0.02) {
        ctx.globalAlpha = Math.min(0.35, speedBlur * 3);
        ctx.drawImage(canvas, x0, yTop, bw, bh, x0 - bw * 0.01, yTop - bh * 0.02, bw * 1.02, bh * 1.04);
        ctx.globalAlpha = 1;
      }
    };

    function draw(dt: number) {
      if (!W) return;
      clock += dt;
      const target = progress?.current ?? 0;
      p += (target - p) * Math.min(1, dt * 5 || 1);
      const speedBlur = Math.abs(p - pPrev);
      pPrev = p;
      const dist = p * DRIVE;
      const tau = dist / CAM_SPEED;

      const narrow = W < 700 * dpr;
      vpx = W * (narrow ? 0.55 : 0.6) + Math.sin(dist * 0.01) * W * 0.004;
      hy = H * 0.5 + Math.sin(dist * 0.037) * H * 0.0025;
      F = H * (narrow ? 0.95 : 1.1);

      // Sky: deepens from dusk to night as we drive
      ctx.globalCompositeOperation = 'source-over';
      const dusk = 1 - p * 0.6;
      const sky = ctx.createLinearGradient(0, 0, 0, hy);
      sky.addColorStop(0, '#050c19');
      sky.addColorStop(0.45, '#0e2342');
      sky.addColorStop(0.78, `rgba(${40 * dusk + 14},${67 * dusk + 20},${107 * dusk + 30},1)`);
      sky.addColorStop(0.93, `rgba(${107 * dusk + 20},${90 * dusk + 25},${110 * dusk + 30},1)`);
      sky.addColorStop(1, `rgba(${184 * dusk + 40},${118 * dusk + 40},${78 * dusk + 40},1)`);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, hy + 2);
      ctx.globalCompositeOperation = 'lighter';
      glow(vpx - W * 0.1, hy, W * 0.6, '255,140,70', 0.14 + 0.1 * dusk);
      glow(vpx + W * 0.25, hy, W * 0.35, '80,140,255', 0.08);

      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 70; i++) {
        const sx = ((i * 7919) % 1000) / 1000;
        const sy = ((i * 104729) % 1000) / 1000;
        ctx.fillStyle = `rgba(210,225,255,${(0.1 + 0.2 * Math.abs(Math.sin(clock * 0.8 + i))) * (1.2 - dusk)})`;
        ctx.fillRect(sx * W, sy * hy * 0.7, dpr, dpr);
      }

      // Cargo aircraft on approach, position tied to the drive
      {
        const ap = mod(tau / 40 + 0.15, 1);
        const ax = W * (1.05 - ap * 1.2);
        const ay = hy * (0.22 + ap * 0.12);
        ctx.strokeStyle = 'rgba(180,200,235,0.06)';
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(ax + W * 0.02, ay - hy * 0.004);
        ctx.lineTo(ax + W * 0.22, ay - hy * 0.03);
        ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        if (Math.sin(clock * 9) > 0.85) glow(ax, ay, 9 * dpr, '255,255,255', 0.95);
        if (Math.sin(clock * 4 + 1) > 0.6) glow(ax + 5 * dpr, ay + 1.5 * dpr, 6 * dpr, '255,60,60', 0.8);
        glow(ax, ay, 2.5 * dpr, '255,240,220', 0.7);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Skyline (grows slightly as we approach the city)
      const cityScale = 0.42 + p * 0.14;
      ctx.fillStyle = '#131c2c';
      for (const b of buildings) ctx.fillRect(b.x * W, hy - b.h * H * cityScale, b.w * W, b.h * H * cityScale + 1);
      ctx.globalCompositeOperation = 'lighter';
      for (const b of buildings) {
        const bx = b.x * W;
        const bw = b.w * W;
        const bh = b.h * H * cityScale;
        for (const l of b.lit) {
          const a = 0.35 + 0.35 * Math.sin(clock * 0.3 + l.p);
          ctx.fillStyle = `rgba(255,${190 + ((l.p * 20) | 0)},120,${a * 0.7})`;
          ctx.fillRect(bx + l.x * (bw - 2 * dpr), hy - bh + 2 * dpr + l.y * (bh - 4 * dpr), 1.2 * dpr, 1.2 * dpr);
        }
      }
      for (let i = 0; i < buildings.length; i += 9) {
        const b = buildings[i];
        if (b.h >= 0.09 && Math.sin(clock * 2 + i) > 0.2) glow(b.x * W + b.w * W * 0.5, hy - b.h * H * cityScale, 5 * dpr, '255,50,50', 0.7);
      }
      ctx.globalCompositeOperation = 'source-over';

      // Ground & road
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
      ctx.fillStyle = '#1b2029';
      quad(P(MEDIAN[0], 0, zn), P(MEDIAN[1], 0, zn), P(MEDIAN[1], 0, FAR), P(MEDIAN[0], 0, FAR));
      ctx.fillStyle = '#0c1210';
      quad(P(MEDIAN[0] + 0.3, 0.9, zn), P(MEDIAN[1] - 0.3, 0.9, zn), P(MEDIAN[1] - 0.3, 0.9, FAR), P(MEDIAN[0] + 0.3, 0.9, FAR));

      // Our headlight beams on the asphalt
      ctx.globalCompositeOperation = 'lighter';
      {
        const [cx, cy] = P(0, 0, 14);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1.6, 0.35);
        glow(0, 0, H * 0.55, '255,235,200', 0.09);
        ctx.restore();
      }

      // Lamp pools
      const lampGap = 42;
      const lampOff = mod(dist, lampGap);
      for (let z = lampGap - lampOff; z < FAR; z += lampGap) {
        for (const side of [6.35, -6.6]) {
          const [cx, cy] = P(side * 0.55, 0, z);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(1, 0.22);
          glow(0, 0, (9 / z) * F, '255,160,70', Math.min(0.22, 5 / z + 0.04));
          ctx.restore();
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      // Lane markings (stretched by scroll speed = motion blur)
      const dash = 3 + Math.min(10, speedBlur * 900);
      const gap = 12 - dash / 4;
      const off = mod(dist, 12);
      ctx.fillStyle = 'rgba(225,230,240,0.55)';
      for (const lx of [-1.75, 1.75, 10.95, 14.45]) {
        for (let z = 12 - off; z < 160; z += 12) {
          if (z < 2.5) continue;
          const z0 = Math.max(zn, z);
          const z1 = z + Math.min(dash, gap + dash);
          quad(P(lx - 0.08, 0, z0), P(lx + 0.08, 0, z0), P(lx + 0.08, 0, z1), P(lx - 0.08, 0, z1));
        }
      }
      ctx.fillStyle = 'rgba(230,200,120,0.5)';
      for (const lx of [-5.25, MEDIAN[0] - 0.1, MEDIAN[1] + 0.1, 17.8]) {
        quad(P(lx - 0.07, 0, zn), P(lx + 0.07, 0, zn), P(lx + 0.07, 0, FAR * 0.6), P(lx - 0.07, 0, FAR * 0.6));
      }

      // Streetlamps
      for (let z = lampGap - lampOff + lampGap * 6; z >= lampGap - lampOff; z -= lampGap) {
        if (z < 2) continue;
        for (const side of [6.35, -6.6]) {
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

      // Vehicles: positions are a pure function of distance travelled
      const heroZ = 46 - 35 * p;
      const list = vehicles.map((v) => ({ v, z: NEAR + mod(v.z0 + v.v * tau, FAR - NEAR) }));
      list.push({ v: hero, z: heroZ });
      list.sort((a, b) => b.z - a.z);
      const trailBoost = 1 + Math.min(3, speedBlur * 250);

      for (const { v, z } of list) {
        if (v.hero) {
          drawHeroTruck(z, speedBlur);
          continue;
        }
        const fade = Math.min(1, (FAR - z) / 80) * Math.min(1, (z - NEAR) / 10);
        if (fade <= 0) continue;
        const half = v.w / 2;
        const [lx, ly] = P(v.x - half + 0.2, v.h * 0.55, z);
        const [rx, ry] = P(v.x + half - 0.2, v.h * 0.55, z);
        const s = Math.max(1.2 * dpr, (0.28 / z) * F);

        const [bx0, by0] = P(v.x - half, v.truck ? 3.4 : 1.45, z);
        const [bx1, by1] = P(v.x + half, 0.25, z);
        ctx.fillStyle = `rgba(${v.truck ? '22,26,34' : '10,13,19'},${0.92 * fade})`;
        ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
        if (v.truck && !v.oncoming && z < 160) {
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
          const trail = Math.min(26, z * 0.5) * trailBoost;
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
          if (z < 40) glow((lx + rx) / 2, ly, Math.min(H * 0.35, (F / z) * 1.6), '255,235,200', Math.min(0.18, 3 / z) * fade);
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
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      // Haze, grade, vignette, grain
      const haze = ctx.createLinearGradient(0, hy - H * 0.08, 0, hy + H * 0.08);
      haze.addColorStop(0, 'rgba(60,70,95,0)');
      haze.addColorStop(0.5, 'rgba(70,75,100,0.22)');
      haze.addColorStop(1, 'rgba(60,70,95,0)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, hy - H * 0.08, W, H * 0.16);
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
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt);
      if (running) raf = requestAnimationFrame(frame);
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

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()));
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    // Redraw once web fonts arrive so the truck's lettering uses Manrope.
    document.fonts?.ready.then(() => draw(0));

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [progress]);

  return <canvas ref={ref} className={`highway-scene ${className}`} aria-hidden />;
}
