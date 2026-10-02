/**
 * Real-time 3D background: a YA² airliner above a sea of clouds at sunset.
 *
 * - Physically based sky (Preetham model) that also lights the aircraft
 *   through an environment map, so the paint and metal pick up the sunset.
 * - The aircraft is modelled in code (no downloaded assets): lathe-turned
 *   fuselage with upswept tail and livery texture, swept wings with dihedral,
 *   winglets, engines, tailplane, fin and navigation / strobe lights.
 * - `getProgress()` (0–1, page scroll) drives the camera along a flight path
 *   and the aircraft forward through the clouds. Scrolling back reverses it.
 */
import * as THREE from 'three';
import { CLOUD_BOTTOM, createCloudLayer } from './cloudLayer';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

type V3 = [number, number, number];

/* --------------------------------- textures -------------------------------- */

function liveryTexture(): THREE.CanvasTexture {
  const W = 2048;
  const H = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  // columns = around the fuselage (u): 0 crown, .25 right, .5 belly, .75 left
  // rows = along it (v, image top = nose)
  const body = g.createLinearGradient(0, 0, W, 0);
  body.addColorStop(0, '#f7f9fc');
  body.addColorStop(0.38, '#eef2f7');
  body.addColorStop(0.44, '#c9d2de');
  body.addColorStop(0.56, '#c9d2de');
  body.addColorStop(0.62, '#eef2f7');
  body.addColorStop(1, '#f7f9fc');
  g.fillStyle = body;
  g.fillRect(0, 0, W, H);

  const col = (u: number) => u * W;
  const row = (v: number) => (1 - v) * H;

  // cheatlines (brand blue + emerald) on both sides
  for (const [u0, u1, color] of [
    [0.262, 0.286, '#146ef5'],
    [0.29, 0.297, '#00a878'],
    [0.714, 0.738, '#146ef5'],
    [0.703, 0.71, '#00a878'],
  ] as [number, number, string][]) {
    g.fillStyle = color;
    g.fillRect(col(u0), row(0.9), col(u1) - col(u0), row(0.12) - row(0.9));
  }

  // passenger windows + doors
  g.fillStyle = '#1b2433';
  for (const u of [0.222, 0.778]) {
    for (let v = 0.2; v < 0.82; v += 0.0145) {
      if (Math.abs(v - 0.55) < 0.01) continue;
      g.beginPath();
      g.roundRect(col(u) - 7, row(v) - 5, 14, 10, 4);
      g.fill();
    }
    g.strokeStyle = 'rgba(40,50,64,0.45)';
    g.lineWidth = 3;
    for (const v of [0.84, 0.55, 0.19]) g.strokeRect(col(u) - 16, row(v) - 14, 34, 28);
  }

  // cockpit windows
  g.fillStyle = '#0d1522';
  for (const [u0, u1] of [
    [0.17, 0.235],
    [0.765, 0.83],
    [0.06, 0.14],
    [0.86, 0.94],
  ]) {
    g.beginPath();
    g.moveTo(col(u0), row(0.935));
    g.lineTo(col(u1), row(0.94));
    g.lineTo(col(u1) - 6, row(0.955));
    g.lineTo(col(u0) + 4, row(0.95));
    g.closePath();
    g.fill();
  }

  // titles: "YA² Transport" along each side, reading tail → nose on the right and nose → tail on the left
  const title = (u: number, rotation: number) => {
    g.save();
    g.translate(col(u), row(0.5));
    g.rotate(rotation);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#0b2a4a';
    g.font = '800 64px Manrope, "Segoe UI", Arial, sans-serif';
    g.fillText('YA', -150, 0);
    g.fillStyle = '#00a878';
    g.font = '800 36px Manrope, "Segoe UI", Arial, sans-serif';
    g.fillText('2', -92, -22);
    g.fillStyle = '#0b2a4a';
    g.font = '700 46px Manrope, "Segoe UI", Arial, sans-serif';
    g.fillText('TRANSPORT', 90, 4);
    g.restore();
  };
  title(0.2, -Math.PI / 2);
  title(0.8, Math.PI / 2);

  // registration near the tail
  g.fillStyle = 'rgba(11,42,74,0.7)';
  g.font = '700 22px Arial, sans-serif';
  g.save();
  g.translate(col(0.24), row(0.16));
  g.rotate(-Math.PI / 2);
  g.fillText('VT-YAT', 0, 0);
  g.restore();

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/* --------------------------------- aircraft -------------------------------- */

function planform(pts: [number, number][]) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) s.lineTo(p[0], p[1]);
  s.closePath();
  return s;
}

function buildAircraft() {
  const plane = new THREE.Group();

  const paint = new THREE.MeshPhysicalMaterial({
    map: liveryTexture(),
    metalness: 0.15,
    roughness: 0.32,
    clearcoat: 0.7,
    clearcoatRoughness: 0.15,
  });
  const wingMat = new THREE.MeshPhysicalMaterial({ color: 0xc9d1dc, metalness: 0.55, roughness: 0.38, clearcoat: 0.3, side: THREE.DoubleSide });
  const brandMat = new THREE.MeshPhysicalMaterial({ color: 0x1564e0, metalness: 0.2, roughness: 0.3, clearcoat: 0.8, side: THREE.DoubleSide });
  const metal = new THREE.MeshStandardMaterial({ color: 0xaeb7c3, metalness: 0.85, roughness: 0.28 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x151a22, metalness: 0.4, roughness: 0.6 });

  // Fuselage: lathe profile from tail (y=-18) to nose (y=+18)
  const prof: THREE.Vector2[] = [];
  for (let y = -18; y <= 18.001; y += 0.5) {
    let r = 2;
    if (y < -8) r = 0.35 + (2 - 0.35) * Math.pow((y + 18) / 10, 0.85);
    if (y > 12) r = 2 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 12) / 6, 2.2)));
    prof.push(new THREE.Vector2(Math.max(r, 0.001), y));
  }
  const fus = new THREE.LatheGeometry(prof, 72);
  fus.rotateX(-Math.PI / 2); // nose → −z, u=0 on the crown
  const pos = fus.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    let y = pos.getY(i);
    if (z > 8) {
      const t = (z - 8) / 10;
      y += t * t * (y < 0 ? 1.55 : 0.55); // upswept tail cone, belly rises most
    }
    if (z < -12) y -= Math.pow((-12 - z) / 6, 2) * 0.35; // drooped nose
    pos.setY(i, y);
  }
  fus.computeVertexNormals();
  plane.add(new THREE.Mesh(fus, paint));

  // Wings (low, swept, with dihedral)
  const wingShape = planform([
    [1.6, -3.6],
    [17, 5.4],
    [17, 7.1],
    [1.6, 3.9],
  ]);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.14, bevelSegments: 3 });
  wingGeo.rotateX(Math.PI / 2);
  for (const side of [1, -1]) {
    const w = new THREE.Mesh(wingGeo, wingMat);
    w.scale.set(side, 1, 1);
    w.position.set(0, -1.05, -0.6);
    w.rotation.z = side * THREE.MathUtils.degToRad(5.5);
    plane.add(w);

    // winglet
    const wlGeo = new THREE.ExtrudeGeometry(planform([[0, 0], [0.9, 1.6], [1.35, 1.6], [1.7, 0]]), { depth: 0.12, bevelEnabled: false });
    wlGeo.rotateY(-Math.PI / 2); // shape x → aircraft z, shape y → up
    const wl = new THREE.Mesh(wlGeo, brandMat);
    wl.position.set(side * 16.95, -0.75 + 17 * Math.tan(THREE.MathUtils.degToRad(5.5)), 5.5);
    wl.rotation.z = -side * 0.25;
    plane.add(wl);

    // engine nacelle + pylon
    const nac = new THREE.Group();
    const nprof = [
      [1.02, 2.2],
      [1.18, 1.9],
      [1.22, 0.9],
      [1.08, -0.9],
      [0.78, -1.9],
      [0.55, -2.1],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const ng = new THREE.LatheGeometry(nprof, 40);
    ng.rotateX(-Math.PI / 2);
    nac.add(new THREE.Mesh(ng, metal));
    const inlet = new THREE.Mesh(new THREE.CircleGeometry(1.0, 40), dark);
    inlet.position.z = -2.15;
    inlet.rotation.y = Math.PI;
    nac.add(inlet);
    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.7, 24), metal);
    spinner.rotation.x = -Math.PI / 2;
    spinner.position.z = -2.35;
    nac.add(spinner);
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 2.8), wingMat);
    pylon.position.set(0, 0.95, 0.4);
    nac.add(pylon);
    nac.position.set(side * 6.3, -2.35 + 6.3 * Math.tan(THREE.MathUtils.degToRad(5.5)), -2.6);
    plane.add(nac);
  }

  // Tailplane
  const hs = new THREE.ExtrudeGeometry(planform([[0.4, -1.6], [6.6, 1.5], [6.6, 2.6], [0.4, 1.6]]), {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.08,
    bevelSegments: 2,
  });
  hs.rotateX(Math.PI / 2);
  for (const side of [1, -1]) {
    const m = new THREE.Mesh(hs, wingMat);
    m.scale.set(side, 1, 1);
    m.position.set(0, 1.25, 14.2);
    m.rotation.z = side * THREE.MathUtils.degToRad(6);
    plane.add(m);
  }

  // Fin (brand blue with an emerald flash)
  const finShape = planform([
    [10.8, 1.2],
    [17.6, 1.6],
    [18.4, 8.6],
    [15.6, 8.6],
  ]);
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.1, bevelSegments: 2 });
  finGeo.rotateY(-Math.PI / 2);
  finGeo.translate(0.14, 0, 0);
  plane.add(new THREE.Mesh(finGeo, brandMat));
  const flash = new THREE.ExtrudeGeometry(planform([[14.2, 5.2], [17.9, 5.6], [18.1, 6.4], [15.1, 6.1]]), { depth: 0.32, bevelEnabled: false });
  flash.rotateY(-Math.PI / 2);
  flash.translate(0.16, 0, 0);
  plane.add(new THREE.Mesh(flash, new THREE.MeshPhysicalMaterial({ color: 0x00a878, roughness: 0.3, clearcoat: 0.8, side: THREE.DoubleSide })));

  // Navigation lights, beacon & strobes
  const glow = glowTexture();
  const light = (color: number, p: V3, size: number) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.position.set(...p);
    s.scale.setScalar(size);
    plane.add(s);
    return s;
  };
  const tipY = -1.05 + 17 * Math.tan(THREE.MathUtils.degToRad(5.5));
  light(0xff2a2a, [-17.1, tipY, 5.4], 1.6); // left: red
  light(0x2aff7a, [17.1, tipY, 5.4], 1.6); // right: green
  const strobeL = light(0xffffff, [-17.1, tipY, 6.8], 3.2);
  const strobeR = light(0xffffff, [17.1, tipY, 6.8], 3.2);
  const beacon = light(0xff3030, [0, 2.15, 1], 2.2);
  const beacon2 = light(0xff3030, [0, -2.05, -2], 2.2);

  return { plane, blink: [strobeL, strobeR], beacons: [beacon, beacon2] };
}

/* ---------------------------------- scene ---------------------------------- */

const PATH: { p: number; cam: V3; roll: number }[] = [
  { p: 0.0, cam: [-62, 12, 58], roll: -0.05 },
  { p: 0.22, cam: [52, -4, -70], roll: 0.12 },
  { p: 0.45, cam: [40, 70, 26], roll: -0.18 },
  { p: 0.7, cam: [72, 5, -6], roll: 0.03 },
  { p: 1.0, cam: [-10, 9, 90], roll: -0.08 },
];

export function createSkyScene(canvas: HTMLCanvasElement, getProgress: () => number) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.55;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 30000);

  const sky = new Sky();
  sky.scale.setScalar(20000);
  sky.renderOrder = -3; // drawn first: the haze layer under the clouds must cover its dark lower half
  const su = sky.material.uniforms;
  su.turbidity.value = 7;
  su.rayleigh.value = 2.2;
  su.mieCoefficient.value = 0.006;
  su.mieDirectionalG.value = 0.86;
  scene.add(sky);

  const sun = new THREE.Vector3();
  const sunLight = new THREE.DirectionalLight(0xffd2a1, 3.2);
  scene.add(sunLight);
  scene.add(new THREE.HemisphereLight(0x9fb8ff, 0x3a2a3a, 0.55));
  scene.fog = new THREE.FogExp2(0xe6b594, 0.0009);

  // environment map from the sky, refreshed as the sun sets
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = new Sky();
  envSky.scale.setScalar(20000);
  envScene.add(envSky);
  let envRT: THREE.WebGLRenderTarget | null = null;
  let seaMatRef: THREE.MeshBasicMaterial | null = null;
  let hazeRef: THREE.ShaderMaterial | null = null;
  let hazeMesh: THREE.Mesh = new THREE.Mesh();
  let lastElevation = 999;

  const setSun = (elevation: number) => {
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(188);
    sun.setFromSphericalCoords(1, phi, theta);
    su.sunPosition.value.copy(sun);
    sunLight.position.copy(sun).multiplyScalar(100);
    const warm = THREE.MathUtils.clamp(1 - elevation / 12, 0, 1);
    sunLight.color.setRGB(1, 0.86 - warm * 0.2, 0.72 - warm * 0.3);
    sunLight.intensity = 1.6 + elevation * 0.25;
    (scene.fog as THREE.FogExp2).color.setRGB(0.62 + warm * 0.25, 0.52 + warm * 0.08, 0.5 - warm * 0.06);
    // what shows through gaps in the clouds: the evening haze, a little darker
    if (seaMatRef) seaMatRef.color.copy((scene.fog as THREE.FogExp2).color).multiplyScalar(0.72);
    ambTop.setRGB(0.5 + warm * 0.22, 0.52 + warm * 0.07, 0.68 - warm * 0.12);
    ambBottom.setRGB(0.24 + warm * 0.08, 0.22 + warm * 0.04, 0.3);
    hazeRef?.uniforms.uColor.value.copy((scene.fog as THREE.FogExp2).color); // seamless with the fogged haze under the clouds
    if (Math.abs(elevation - lastElevation) > 0.6) {
      lastElevation = elevation;
      const eu = envSky.material.uniforms;
      for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG'] as const) eu[k].value = su[k].value;
      eu.sunPosition.value.copy(sun);
      envRT?.dispose();
      envRT = pmrem.fromScene(envScene as unknown as THREE.Scene);
      scene.environment = envRT.texture;
    }
  };

  // aircraft
  const { plane, blink, beacons } = buildAircraft();
  scene.add(plane);

  // volumetric cloud deck below the aircraft (ray-marched, see cloudLayer.ts)
  const small = window.matchMedia('(max-width: 760px)').matches;
  const cloudLayer = createCloudLayer({ small });
  scene.add(cloudLayer.composite);
  const ambTop = new THREE.Color();
  const ambBottom = new THREE.Color();

  // distant cloud sea / haze so the view below the horizon is never empty
  // seen through gaps in the clouds: a darker, hazier layer far below
  const seaMat = new THREE.MeshBasicMaterial({ color: 0x8f8590, fog: true, depthWrite: false });
  seaMatRef = seaMat;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = CLOUD_BOTTOM - 40;
  sea.renderOrder = -2;
  scene.add(sea);

  // soft atmospheric haze band that melts the cloud sea into the sky
  const hazeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    fog: false,
    uniforms: { uColor: { value: new THREE.Color(0xd9b4a0) } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uColor; varying vec3 vDir;
      void main(){ float a = smoothstep(0.17, 0.0, vDir.y) * smoothstep(-0.5, -0.04, vDir.y); gl_FragColor = vec4(uColor, a); }`,
  });
  hazeRef = hazeMat;
  const haze = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), hazeMat);
  hazeMesh = haze;
  haze.renderOrder = -1;
  scene.add(haze);

  // camera path
  const camCurve = new THREE.CatmullRomCurve3(PATH.map((k) => new THREE.Vector3(...k.cam)), false, 'centripetal');
  const tmp = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  let p = getProgress();
  let clock = 0;
  let raf = 0;
  let running = false;
  let last = performance.now();
  let w = 0;
  let h = 0;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.6));
    renderer.setSize(w, h, false);
    cloudLayer.setSize(w, h, renderer.getPixelRatio());
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 52 : 38;
    camera.updateProjectionMatrix();
  };

  const render = (dt: number) => {
    clock += dt;
    p += (getProgress() - p) * Math.min(1, dt * 3.5);

    setSun(5.5 - p * 5); // golden hour → sunset

    // aircraft: gentle bob and bank; flies ahead into the sunset at the end
    const flyAway = THREE.MathUtils.smoothstep(p, 0.82, 1);
    plane.position.set(0, Math.sin(clock * 0.6) * 0.35, -flyAway * 90);
    const seg = PATH.findIndex((k) => k.p >= p);
    const k1 = PATH[Math.max(1, seg)];
    const k0 = PATH[Math.max(0, seg - 1)];
    const lt = (p - k0.p) / Math.max(0.0001, k1.p - k0.p);
    plane.rotation.set(Math.sin(clock * 0.45) * 0.012 + flyAway * 0.06, 0, THREE.MathUtils.lerp(k0.roll, k1.roll, THREE.MathUtils.smoothstep(lt, 0, 1)) + Math.sin(clock * 0.35) * 0.02);

    // lights
    const strobeOn = clock % 1.3 < 0.06 || (clock % 1.3 > 0.16 && clock % 1.3 < 0.22);
    for (const s of blink) s.visible = strobeOn;
    const beaconOn = clock % 1.1 < 0.15;
    for (const b of beacons) b.visible = beaconOn;

    // clouds stream past: time + scroll both move us forward
    const travel = clock * 18 + p * 900;
    cloudLayer.update({ sunDir: sun, sunColor: sunLight.color.clone().multiplyScalar(sunLight.intensity * 1.35), ambTop, ambBottom, fog: (scene.fog as THREE.FogExp2).color, travel });

    // camera on its path, framing the aircraft to the right on wide screens
    camCurve.getPoint(Math.min(0.9999, p), tmp);
    camera.position.copy(tmp).add(plane.position);
    const target = plane.position.clone();
    const dir = target.clone().sub(camera.position).normalize();
    right.crossVectors(dir, up).normalize();
    const dist = camera.position.distanceTo(target);
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist * camera.aspect;
    const shift = w > 1024 ? halfW * 0.3 * (1 - flyAway) : 0;
    const lift = w <= 1024 ? -Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist * 0.28 : 0;
    target.addScaledVector(right, -shift).addScaledVector(up, lift);
    camera.lookAt(target);
    hazeMesh.position.copy(camera.position);

    cloudLayer.render(renderer, camera, dt);
    renderer.render(scene, camera);
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    render(dt);
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
  render(0.016);
  const ro = new ResizeObserver(() => {
    resize();
    render(0);
  });
  ro.observe(canvas);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);
  if (!document.hidden) start();

  return () => {
    stop();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    envRT?.dispose();
    cloudLayer.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
}
