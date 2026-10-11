/**
 * The hero's 3D flacon, drawn with three.js (no React inside, so it can be
 * loaded lazily after the page is interactive).
 *
 * An octagonal "jewel" bottle: faceted glass, a coloured liquid, a gold collar
 * and cap crowned with an emerald stone, the HC monogram printed on the front,
 * a gold orbit ring and slow-rising gold dust. It turns and floats on its own,
 * tilts towards the pointer and can be spun by dragging sideways.
 */
import {
  AddEquation,
  AddOperation,
  AmbientLight,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CubeCamera,
  CustomBlending,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  FrontSide,
  Group,
  LatheGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OneFactor,
  NeutralToneMapping,
  OctahedronGeometry,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  SrcAlphaFactor,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  Vector2,
  WebGLCubeRenderTarget,
  WebGLRenderer,
  ZeroFactor,
  type Material,
  type Texture,
} from "three";
import { LIQUIDS, type Liquid } from "./liquids";

export interface BottleOptions {
  liquid: Liquid;
  /** False for prefers-reduced-motion: no turning, floating or drifting (dragging still works). */
  motion: boolean;
  /** Fewer particles and a lower pixel ratio, for phones. */
  lowPower: boolean;
  /** Starting turn in radians (used to pick a flattering angle for the still image). */
  angle?: number;
  monogramUrl: string;
  /** Called once the first complete frame (monogram included) is on screen. */
  onReady?: () => void;
  /** Called if WebGL is lost; the caller shows the still image instead. */
  onLost?: () => void;
}

export interface BottleHandle {
  setLiquid(liquid: Liquid): void;
  dispose(): void;
}

const GOLD = 0xd5b477;
const FACETS = 8;
/** Rotate the lathe half a facet so a flat face (not an edge) looks at the camera. */
const FACE_FRONT = Math.PI / FACETS;

const profile = (pts: [number, number][]) => pts.map(([x, y]) => new Vector2(x, y));

/** Radius / height outlines, turned into octagonal solids. */
const BODY_R = 0.8;
const BODY = profile([
  [0, 0], [0.62, 0], [0.74, 0.05], [0.78, 0.16], [BODY_R, 0.9], [BODY_R, 1.7], [0.78, 2.05],
  [0.66, 2.22], [0.4, 2.36], [0.27, 2.42], [0.24, 2.5], [0.24, 2.66], [0, 2.66],
]);
const LIQUID = profile([[0, 0.24], [0.6, 0.24], [0.68, 0.31], [0.71, 0.9], [0.71, 1.7], [0.69, 1.86], [0, 1.86]]);
const CAP = profile([
  [0, 0], [0.32, 0], [0.35, 0.04], [0.36, 0.12], [0.36, 0.62], [0.33, 0.68], [0.36, 0.72],
  [0.36, 0.8], [0.3, 0.88], [0.16, 0.93], [0, 0.94],
]);
const CAP_Y = 2.48;
const CAP_H = 0.94;
const CENTER_Y = 1.8;
const RING = [1.48, 1.74];

/**
 * Product-photography studios used as reflections. The dark one (black walls,
 * two tall strip lights, a softbox) gives the glass crisp highlights instead of
 * a milky haze; the bright one adds a large warm fill so the metal reads gold.
 */
function studio(bright: boolean): Scene {
  const env = new Scene();
  env.background = new Color(bright ? 0x3b3324 : 0x0b0d0c);
  const panel = (w: number, h: number, intensity: number, color: number, pos: [number, number, number]) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(0.45, 9, 4, 0xffffff, [-4.5, 0.5, 2.4]); // tall strip, left
  panel(0.35, 9, 3, 0xfff3dc, [4.6, 0.5, 1.6]); // tall strip, right
  panel(4, 2.5, 1.6, 0xfff1d6, [1.5, 5, 4]); // overhead softbox
  panel(5, 1.5, 0.5, 0xd5b477, [0, -4, 3]); // warm bounce from below
  panel(3, 5, 0.45, 0x5fd1ad, [-2, 1, -5]); // emerald rim behind
  if (bright) {
    panel(9, 7, 1.4, 0xfff0d0, [0, 1.5, 6]); // big warm fill behind the camera
    panel(8, 4, 2.2, 0xffffff, [0, 6, 0]); // ceiling bounce
  }
  return env;
}

/** Bright, slightly more opaque edges, like real glass seen at a grazing angle. */
function withFresnel(material: MeshPhysicalMaterial, strength: number, tint: Color) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = { value: tint };
    shader.uniforms.uRimStrength = { value: strength };
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform vec3 uRim;\nuniform float uRimStrength;\nvoid main() {")
      .replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
        float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6) * uRimStrength;
        gl_FragColor.rgb += uRim * rim;
        gl_FragColor.a = clamp(gl_FragColor.a + rim * 0.3, 0.0, 1.0);`,
      );
  };
  material.customProgramCacheKey = () => `fresnel-${strength}`;
  return material;
}

/**
 * Additive light that leaves the canvas's alpha untouched. Plain additive blending
 * would also add alpha, turning the see-through glass opaque black over the page.
 */
function glow<M extends Material>(material: M): M {
  material.blending = CustomBlending;
  material.blendEquation = AddEquation;
  material.blendSrc = SrcAlphaFactor;
  material.blendDst = OneFactor;
  material.blendSrcAlpha = ZeroFactor;
  material.blendDstAlpha = OneFactor;
  material.transparent = true;
  material.depthWrite = false;
  return material;
}

function softDot(size = 64): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function mountBottle(canvas: HTMLCanvasElement, opts: BottleOptions): BottleHandle {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 60);

  const pmrem = new PMREMGenerator(renderer);
  const bake = (bright: boolean) => {
    const env = studio(bright);
    const target = pmrem.fromScene(env, bright ? 0.035 : 0.02);
    env.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (m.material as Material).dispose();
      }
    });
    return target;
  };
  const envTarget = bake(false);
  const metalEnv = bake(true);
  scene.environment = envTarget.texture;
  // A sharp cube map of the dark studio for the glass highlights (see `shine`).
  const cubeTarget = new WebGLCubeRenderTarget(opts.lowPower ? 128 : 256);
  {
    const env = studio(false);
    new CubeCamera(0.1, 50, cubeTarget).update(renderer, env);
    env.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (m.material as Material).dispose();
      }
    });
  }

  scene.add(new AmbientLight(0xffffff, 0.35));
  const key = new DirectionalLight(0xfff0d4, 1.6);
  key.position.set(3, 5, 4);
  const rim = new DirectionalLight(0x7fe0c0, 1.6);
  rim.position.set(-4, 2.5, -3);
  const warm = new DirectionalLight(0xd5b477, 1);
  warm.position.set(-3, -1, 3);
  scene.add(key, rim, warm);

  const disposables: { dispose(): void }[] = [envTarget, metalEnv, cubeTarget, pmrem];
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  // ---- The flacon -----------------------------------------------------------
  const bottle = new Group();
  const turn = new Group(); // spins around the vertical axis
  turn.add(bottle);
  bottle.position.y = -CENTER_Y;
  const stage = new Group(); // floats and tilts, centred on the origin
  stage.add(turn);
  scene.add(stage);

  const bodyGeo = track(new LatheGeometry(BODY, FACETS, FACE_FRONT));
  const glassTint = new Color(0xe9fff6);
  const glassBack = track(
    withFresnel(
      new MeshPhysicalMaterial({
        color: 0xffffff, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.06,
        side: BackSide, depthWrite: false, envMapIntensity: 1, flatShading: true, emissive: 0x6fa898, emissiveIntensity: 0.5,
        specularIntensity: 0,
      }),
      0.25, glassTint,
    ),
  );
  // A barely-there tint with luminous edges…
  const glassFront = track(
    withFresnel(
      new MeshPhysicalMaterial({
        color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.05,
        side: FrontSide, depthWrite: false, envMapIntensity: 1, flatShading: true, emissive: 0x9fd2c2, emissiveIntensity: 0.45,
        specularIntensity: 0,
      }),
      0.55, glassTint,
    ),
  );
  // …plus the studio's strip lights reflected on each facet, added on top like real
  // highlights. Unlit on purpose: the scene's lamps would turn whole facets white.
  const shine = track(
    glow(new MeshBasicMaterial({ color: 0x000000, envMap: cubeTarget.texture, combine: AddOperation, reflectivity: 0.32 })),
  );
  // Per-face normals so each facet reflects as one flat mirror.
  const facetedGeo = track(bodyGeo.toNonIndexed());
  facetedGeo.computeVertexNormals();
  const back = new Mesh(bodyGeo, glassBack);
  back.renderOrder = 1;
  const front = new Mesh(bodyGeo, glassFront);
  front.renderOrder = 4;
  const highlights = new Mesh(facetedGeo, shine);
  highlights.renderOrder = 6;

  const liquidMat = track(
    new MeshPhysicalMaterial({
      roughness: 0.4, metalness: 0, transparent: true, specularIntensity: 0.08,
      envMapIntensity: 0.6, flatShading: true, depthWrite: false, vertexColors: true,
    }),
  );
  const liquidGeo = track(new LatheGeometry(LIQUID, FACETS, FACE_FRONT));
  {
    // Deeper at the base, glowing towards the surface.
    const pos = liquidGeo.getAttribute("position");
    const shade = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const k = MathUtils.smoothstep(pos.getY(i), 0.24, 1.86);
      shade.fill(MathUtils.lerp(0.55, 1.25, k), i * 3, i * 3 + 3);
    }
    liquidGeo.setAttribute("color", new BufferAttribute(shade, 3));
  }
  const liquid = new Mesh(liquidGeo, liquidMat);
  liquid.renderOrder = 2;

  const gold = track(
    new MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.24, envMap: metalEnv.texture, envMapIntensity: 1.25, flatShading: true }),
  );
  const collar = new Mesh(track(new CylinderGeometry(0.3, 0.3, 0.08, FACETS, 1, false, FACE_FRONT)), gold);
  collar.position.y = 2.44;
  const cap = new Mesh(track(new LatheGeometry(CAP, FACETS, FACE_FRONT)), gold);
  cap.position.y = CAP_Y;
  const stoneMat = track(
    new MeshPhysicalMaterial({
      color: 0x0b6b4c, roughness: 0.05, metalness: 0.1, clearcoat: 1, envMap: metalEnv.texture, envMapIntensity: 1.4,
      flatShading: true, emissive: 0x032a1f, emissiveIntensity: 0.6,
    }),
  );
  const stone = new Mesh(track(new OctahedronGeometry(0.13)), stoneMat);
  stone.scale.set(1, 1.5, 1);
  stone.position.y = CAP_Y + CAP_H + 0.17;

  // HC monogram printed on the front facet.
  const plateMat = track(new MeshBasicMaterial({ transparent: true, opacity: 0, side: DoubleSide, depthWrite: false, toneMapped: false }));
  const plate = new Mesh(track(new PlaneGeometry(0.44, 0.44 * (341 / 307))), plateMat);
  plate.position.set(0, 1.12, BODY_R * Math.cos(Math.PI / FACETS) + 0.01);
  plate.renderOrder = 5;
  let monogram: Texture | null = null;

  bottle.add(back, liquid, front, highlights, collar, cap, stone, plate);

  // ---- Orbit rings with a travelling bead ----------------------------------
  const ringMat = track(new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.55, depthWrite: false }));
  const ringFaint = track(new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.18, depthWrite: false }));
  const ringGeo = track(new TorusGeometry(RING[0], 0.007, 6, 180));
  const ringGeo2 = track(new TorusGeometry(RING[1], 0.005, 6, 200));
  const ring = new Mesh(ringGeo, ringMat);
  const ring2 = new Mesh(ringGeo2, ringFaint);
  const orbit = new Group();
  orbit.add(ring, ring2);
  orbit.rotation.set(Math.PI / 2 - 0.32, 0, 0.22);
  orbit.position.y = 0.15;
  const beadMat = track(new MeshBasicMaterial({ color: 0xf3dca6, toneMapped: false }));
  const beadGeo = track(new SphereGeometry(0.04, 16, 12));
  const bead = new Mesh(beadGeo, beadMat);
  const bead2 = new Mesh(beadGeo, beadMat);
  bead2.scale.setScalar(0.7);
  orbit.add(bead, bead2);
  stage.add(orbit);

  // ---- Gold dust -------------------------------------------------------------
  const COUNT = opts.lowPower ? 56 : 120;
  const dust = new Float32Array(COUNT * 3);
  const speed = new Float32Array(COUNT);
  const rand = mulberry32(7);
  for (let i = 0; i < COUNT; i++) {
    const a = rand() * Math.PI * 2;
    const r = 0.8 + rand() * 1.4;
    dust[i * 3] = Math.cos(a) * r;
    dust[i * 3 + 1] = -2.1 + rand() * 4.3;
    dust[i * 3 + 2] = Math.sin(a) * r - 0.4;
    speed[i] = 0.05 + rand() * 0.12;
  }
  const dustGeo = track(new BufferGeometry());
  const dustPos = new BufferAttribute(dust, 3);
  dustGeo.setAttribute("position", dustPos);
  const dotTex = track(softDot());
  const dustMat = track(
    glow(new PointsMaterial({ color: 0xe8c98a, size: 0.06, map: dotTex, opacity: 0.8, sizeAttenuation: true })),
  );
  const points = new Points(dustGeo, dustMat);
  stage.add(points);

  // Pool of warm light under the bottle.
  const poolTex = track(softDot(128));
  const poolMat = track(glow(new MeshBasicMaterial({ map: poolTex, color: GOLD, opacity: 0.42, toneMapped: false })));
  const pool = new Mesh(track(new PlaneGeometry(2.8, 2.8)), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = -CENTER_Y - 0.02;
  stage.add(pool);

  const setLiquid = (name: Liquid) => {
    const l = LIQUIDS[name] ?? LIQUIDS.emerald;
    liquidMat.color.set(l.color);
    liquidMat.emissive.set(l.glow);
    liquidMat.emissiveIntensity = 0.55;
    liquidMat.opacity = l.opacity;
    stoneMat.color.set(l.stone);
    requestRender();
  };

  // ---- Sizing ----------------------------------------------------------------
  const maxDpr = opts.lowPower ? 1.5 : 2;
  let width = 0;
  let height = 0;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (w === width && h === height) return;
    width = w;
    height = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the whole piece (bottle, rings and dust) whatever the container's shape.
    const halfV = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const needH = 4.0 / 2 / halfV;
    const needW = 3.6 / 2 / (halfV * camera.aspect);
    const dist = Math.max(needH, needW) + 0.8;
    camera.position.set(0, 0.55, dist);
    camera.lookAt(0, 0.12, 0);
    camera.updateProjectionMatrix();
    requestRender();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // ---- Interaction -------------------------------------------------------------
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  let spin = 0;
  let spinVel = 0;
  let dragging = false;
  let lastX = 0;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const onPointerMove = (e: PointerEvent) => {
    if (dragging) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      spin += dx * 0.012;
      spinVel = dx * 0.012;
      requestRender();
      return;
    }
    if (!finePointer) return;
    const r = canvas.getBoundingClientRect();
    tilt.tx = MathUtils.clamp((e.clientX - (r.left + r.width / 2)) / (r.width * 1.5), -1, 1);
    tilt.ty = MathUtils.clamp((e.clientY - (r.top + r.height / 2)) / (r.height * 1.5), -1, 1);
    if (!opts.motion) requestRender();
  };
  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    spinVel = 0;
    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = "grabbing";
    wake();
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
    canvas.style.cursor = "";
    wake();
  };
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  // ---- Loop ----------------------------------------------------------------------
  let visible = true;
  let raf = 0;
  let last = 0;
  let t = 0;
  let disposed = false;
  let started = false; // set once the shaders are compiled
  let readyFired = false;

  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) wake();
  });
  io.observe(canvas);
  const onVisibility = () => !document.hidden && wake();
  document.addEventListener("visibilitychange", onVisibility);

  const animating = () =>
    visible && !document.hidden && (opts.motion || dragging || Math.abs(spinVel) > 0.0005 || Math.abs(tilt.tx - tilt.x) > 0.001 || Math.abs(tilt.ty - tilt.y) > 0.001);

  function frame(now: number) {
    raf = 0;
    if (disposed) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    if (opts.motion) t += dt;

    if (!dragging) {
      spin += spinVel;
      spinVel *= Math.pow(0.9, dt * 60);
    }
    const ease = 1 - Math.pow(0.001, dt);
    tilt.x += (tilt.tx - tilt.x) * ease;
    tilt.y += (tilt.ty - tilt.y) * ease;

    turn.rotation.y = (opts.angle ?? -0.35) + t * 0.32 + spin;
    stage.position.y = Math.sin(t * 0.9) * 0.08;
    stage.rotation.z = Math.sin(t * 0.55) * 0.035 - tilt.x * 0.1;
    stage.rotation.x = tilt.y * 0.08;
    pool.scale.setScalar(1 - stage.position.y * 0.6);
    poolMat.opacity = 0.42 - stage.position.y * 0.6;

    const a = t * 0.45;
    bead.position.set(Math.cos(a) * RING[0], Math.sin(a) * RING[0], 0);
    bead2.position.set(Math.cos(-a * 0.7 + 2) * RING[1], Math.sin(-a * 0.7 + 2) * RING[1], 0);
    stone.rotation.y = -t * 0.6;

    if (opts.motion) {
      for (let i = 0; i < COUNT; i++) {
        let y = dust[i * 3 + 1] + speed[i] * dt;
        if (y > 2.3) y = -2.1;
        dust[i * 3 + 1] = y;
      }
      dustPos.needsUpdate = true;
      points.rotation.y = t * 0.05;
    }

    // The printed monogram is seen through the glass when it turns away from us.
    const facing = Math.cos(turn.rotation.y) > 0;
    plate.renderOrder = facing ? 5 : 1.5;

    renderer.render(scene, camera);
    if (!readyFired && monogram) {
      readyFired = true;
      opts.onReady?.();
    }
    if (animating()) raf = requestAnimationFrame(frame);
    else last = 0;
  }

  function wake() {
    if (started && !raf && !disposed && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function requestRender() {
    if (started && !raf && !disposed) raf = requestAnimationFrame(frame);
  }

  const onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    opts.onLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  new TextureLoader().load(
    opts.monogramUrl,
    (tex) => {
      if (disposed) return tex.dispose();
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      monogram = track(tex);
      plateMat.map = tex;
      plateMat.opacity = 0.95;
      plateMat.needsUpdate = true;
      requestRender();
    },
    undefined,
    () => {
      // No monogram: show the bottle without it rather than not at all.
      monogram = dotTex;
      requestRender();
    },
  );

  setLiquid(opts.liquid);
  resize();
  // Compile the shaders off the main thread where the browser supports it, so the
  // page stays responsive while the bottle gets ready; then start drawing.
  const begin = () => {
    if (started || disposed) return;
    started = true;
    wake();
  };
  if (renderer.extensions.has("KHR_parallel_shader_compile")) {
    renderer.compileAsync(scene, camera).then(begin, begin);
    setTimeout(begin, 1500);
  } else {
    begin();
  }

  return {
    setLiquid,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("webglcontextlost", onLost);
      for (const d of disposables) d.dispose();
      scene.traverse((o) => {
        const m = (o as Mesh).material as Material | Material[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

/** Small deterministic PRNG so the dust looks the same on every visit (and in the still image). */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
