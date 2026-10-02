/**
 * Volumetric cloud deck below the aircraft, ray-marched in a shader.
 *
 * Every pixel walks through a slab of air (CLOUD_BOTTOM … CLOUD_TOP), reads
 * density from a tileable Perlin–Worley noise volume, and lights each sample
 * by marching towards the sun (Beer–Lambert absorption, "powder" darkening,
 * two-lobe Henyey–Greenstein scattering for silver linings). It renders at
 * reduced resolution into its own target, which the main scene composites
 * behind the aircraft — soft clouds lose nothing at half size.
 */
import * as THREE from 'three';
import { buildCloudNoise } from './cloudNoise';

export const CLOUD_BOTTOM = -92;
export const CLOUD_TOP = -14;

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const frag = /* glsl */ `
  precision highp float;
  precision highp sampler3D;
  uniform sampler3D uNoise;
  uniform mat4 uInvProj;
  uniform mat4 uCamWorld;
  uniform vec3 uCamPos;
  uniform vec3 uSunDir;
  uniform vec3 uSunCol;
  uniform vec3 uAmbTop;
  uniform vec3 uAmbBottom;
  uniform vec3 uFogCol;
  uniform vec3 uWind;
  uniform float uFade;
  varying vec2 vUv;

  const float BOT = ${CLOUD_BOTTOM.toFixed(1)};
  const float TOP = ${CLOUD_TOP.toFixed(1)};
  const float MAX_DIST = 3000.0;

  // fixed per-pixel jitter: hides step banding without frame-to-frame shimmer
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float remap(float v, float a, float b, float c, float d) { return c + (v - a) / (b - a) * (d - c); }
  float hg(float c, float g) { float g2 = g * g; return (1.0 - g2) / (4.0 * 3.14159 * pow(1.0 + g2 - 2.0 * g * c, 1.5)); }

  // density 0..1 at a world position
  float density(vec3 p, bool cheap) {
    float h = clamp((p.y - BOT) / (TOP - BOT), 0.0, 1.0);
    // flat-ish bases, rounded rising tops (cumulus profile)
    float profile = smoothstep(0.0, 0.22, h) * smoothstep(1.0, 0.3, h);
    vec3 q = (p + uWind) * 0.0034;
    vec4 n = texture(uNoise, q);
    // large-scale coverage so the deck breaks into separate cloud banks
    float cover = texture(uNoise, q * 0.17 + vec3(0.37, 0.11, 0.53)).b;
    float coverage = smoothstep(0.3, 0.72, cover) * 0.42 + 0.24;
    float base = remap(n.r * profile, 1.0 - coverage, 1.0, 0.0, 1.0);
    if (base <= 0.0 || cheap) return clamp(base, 0.0, 1.0);
    // erode the edges with high-frequency detail: wispy at the bottom, billowy on top
    float detail = texture(uNoise, q * 4.7).g * 0.7 + texture(uNoise, q * 11.0).g * 0.3;
    float erosion = mix(1.0 - detail, detail, clamp(h * 3.0, 0.0, 1.0));
    // denser cores higher up: dark, heavy bases and bright, firm tops
    return clamp(remap(base, erosion * 0.45, 1.0, 0.0, 1.0), 0.0, 1.0) * mix(0.35, 1.0, h);
  }

  void main() {
    vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
    vec3 dir = normalize(mat3(uCamWorld) * normalize(vp.xyz / vp.w));
    vec3 ro = uCamPos;

    // intersect the cloud slab
    float tA, tB;
    if (abs(dir.y) < 1e-4) { gl_FragColor = vec4(0.0); return; }
    float t0 = (TOP - ro.y) / dir.y;
    float t1 = (BOT - ro.y) / dir.y;
    tA = max(0.0, min(t0, t1));
    tB = min(MAX_DIST, max(t0, t1));
    if (tB <= tA) { gl_FragColor = vec4(0.0); return; }

    float steps = float(STEPS);
    float len = tB - tA;
    float dt = len / steps;
    float t = tA + dt * hash(gl_FragCoord.xy);

    float cosT = dot(dir, uSunDir);
    // forward scattering (silver lining) + back scattering, never fully dark
    float phase = max(0.75, mix(hg(cosT, 0.6), hg(cosT, -0.2), 0.35) * 3.14159 * 4.0);

    vec3 col = vec3(0.0);
    float T = 1.0;
    float firstHit = -1.0;
    for (int i = 0; i < STEPS; i++) {
      if (T < 0.02) break;
      vec3 p = ro + dir * t;
      float d = density(p, false);
      if (d > 0.002) {
        if (firstHit < 0.0) firstHit = t;
        // light march towards the sun
        float od = 0.0;
        vec3 lp = p;
        float ls = 5.0;
        for (int j = 0; j < LIGHT_STEPS; j++) {
          lp += uSunDir * ls;
          od += density(lp, true) * ls;
          ls *= 1.7;
        }
        float h = clamp((p.y - BOT) / (TOP - BOT), 0.0, 1.0);
        // multiple-scattering approximation: a bright first octave plus a softer, deeper one
        float beer = max(max(exp(-od * 0.11), exp(-od * 0.026) * 0.32), 0.1);
        float powder = 1.0 - exp(-d * 8.0);
        vec3 sunL = uSunCol * beer * mix(1.0, powder * 2.0, 0.5) * phase;
        vec3 amb = mix(uAmbBottom, uAmbTop, smoothstep(0.0, 1.0, h));
        vec3 lit = sunL + amb;
        float sigma = d * 0.13;
        float a = 1.0 - exp(-sigma * dt);
        col += T * a * lit;
        T *= 1.0 - a;
      }
      t += dt;
    }

    float alpha = 1.0 - T;
    if (alpha < 0.002) { gl_FragColor = vec4(0.0); return; }
    // aerial perspective: distant clouds melt into the haze
    float dist = firstHit < 0.0 ? tA : firstHit;
    float fogK = 1.0 - exp(-dist * 0.00052);
    vec3 c = col / alpha;
    c = mix(c, uFogCol, fogK * 0.8);
    // far clouds dissolve into the horizon haze instead of ending at a hard line
    alpha *= (1.0 - smoothstep(MAX_DIST * 0.45, MAX_DIST, dist)) * uFade;
    gl_FragColor = vec4(c * alpha, alpha); // premultiplied
  }
`;

export interface CloudLayer {
  /** Mesh to add to the main scene: draws the clouds behind everything else. */
  composite: THREE.Mesh;
  setSize(width: number, height: number, pixelRatio: number): void;
  /** Renders the clouds for this frame into their own target. */
  render(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, dt: number): void;
  update(o: { sunDir: THREE.Vector3; sunColor: THREE.Color; ambTop: THREE.Color; ambBottom: THREE.Color; fog: THREE.Color; travel: number }): void;
  dispose(): void;
}

export function createCloudLayer(opts: { small: boolean }): CloudLayer {
  let scale = opts.small ? 0.45 : 0.6;
  const minScale = 0.3;
  let size = { w: 1, h: 1, pr: 1 };
  let slowFrames = 0;
  let avgDt = 1 / 60;
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  target.texture.minFilter = THREE.LinearFilter;
  target.texture.magFilter = THREE.LinearFilter;

  const N = 48;
  const noise = new THREE.Data3DTexture(new Uint8Array(4), 1, 1, 1);
  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    defines: { STEPS: opts.small ? 32 : 46, LIGHT_STEPS: opts.small ? 3 : 4 },
    uniforms: {
      uNoise: { value: noise },
      uInvProj: { value: new THREE.Matrix4() },
      uCamWorld: { value: new THREE.Matrix4() },
      uCamPos: { value: new THREE.Vector3() },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunCol: { value: new THREE.Color() },
      uAmbTop: { value: new THREE.Color() },
      uAmbBottom: { value: new THREE.Color() },
      uFogCol: { value: new THREE.Color() },
      uWind: { value: new THREE.Vector3() },
      uFade: { value: 0 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const cloudScene = new THREE.Scene();
  cloudScene.add(quad);
  const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let ready = false;
  let disposed = false;
  buildCloudNoise(N).then((data) => {
    if (disposed) return;
    const tex = new THREE.Data3DTexture(data, N, N, N);
    tex.format = THREE.RGBAFormat;
    tex.type = THREE.UnsignedByteType;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
    tex.unpackAlignment = 1;
    tex.needsUpdate = true;
    material.uniforms.uNoise.value = tex;
    ready = true;
  });

  // composite: samples the low-res cloud image at screen position, then tone-maps like the rest of the scene
  const compMat = new THREE.ShaderMaterial({
    uniforms: { uClouds: { value: target.texture }, uRes: { value: new THREE.Vector2(1, 1) } },
    vertexShader: /* glsl */ `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uClouds; uniform vec2 uRes;
      void main() {
        vec4 c = texture2D(uClouds, gl_FragCoord.xy / uRes);
        if (c.a < 0.003) discard;
        gl_FragColor = vec4(c.rgb / c.a, c.a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    transparent: true,
    depthTest: true, // the aircraft (drawn first, opaque) stays in front
    depthWrite: false,
    fog: false,
  });
  const composite = new THREE.Mesh(new THREE.SphereGeometry(8000, 24, 12), compMat);
  composite.frustumCulled = false;
  composite.renderOrder = 0; // after the horizon haze (-1)
  composite.onBeforeRender = (_r, _s, cam) => composite.position.copy(cam.position);

  const u = material.uniforms;
  const clearColor = new THREE.Color();
  return {
    composite,
    setSize(width, height, pixelRatio) {
      size = { w: width, h: height, pr: pixelRatio };
      target.setSize(Math.max(1, Math.round(width * pixelRatio * scale)), Math.max(1, Math.round(height * pixelRatio * scale)));
      compMat.uniforms.uRes.value.set(width * pixelRatio, height * pixelRatio);
    },
    update(o) {
      u.uSunDir.value.copy(o.sunDir).normalize();
      u.uSunCol.value.copy(o.sunColor);
      u.uAmbTop.value.copy(o.ambTop);
      u.uAmbBottom.value.copy(o.ambBottom);
      u.uFogCol.value.copy(o.fog);
      // the deck streams towards the camera as we fly forward
      u.uWind.value.set(o.travel * 0.06, 0, -o.travel);
    },
    render(renderer, camera, dt) {
      if (!ready) return;
      u.uFade.value = Math.min(1, u.uFade.value + dt * 1.2);
      // keep the animation smooth on slower GPUs: drop cloud resolution if frames run long
      if (dt > 0) {
        avgDt += (dt - avgDt) * 0.1;
        slowFrames = avgDt > 1 / 38 ? slowFrames + 1 : 0;
        if (slowFrames > 40 && scale > minScale) {
          scale = Math.max(minScale, scale * 0.8);
          slowFrames = 0;
          this.setSize(size.w, size.h, size.pr);
        }
      }
      camera.updateMatrixWorld();
      u.uInvProj.value.copy(camera.projectionMatrixInverse);
      u.uCamWorld.value.copy(camera.matrixWorld);
      u.uCamPos.value.copy(camera.position);
      const prev = renderer.getRenderTarget();
      const prevAlpha = renderer.getClearAlpha();
      renderer.getClearColor(clearColor);
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(cloudScene, orthoCam);
      renderer.setRenderTarget(prev);
      renderer.setClearColor(clearColor, prevAlpha);
    },
    dispose() {
      disposed = true;
      target.dispose();
      material.dispose();
      compMat.dispose();
      (u.uNoise.value as THREE.Texture).dispose();
    },
  };
}
