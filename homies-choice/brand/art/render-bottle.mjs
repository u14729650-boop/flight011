// Renders the still images of the hero bottle (one per liquid colour) from the
// same three.js scene the site uses, so the first paint and the no-WebGL fallback
// match the live 3D exactly.
//
//   node brand/art/render-bottle.mjs   (needs Playwright's Chromium; set CHROMIUM_PATH if it is elsewhere)
//
// Writes public/images/editorial/bottle-<liquid>.webp (transparent background).
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LIQUIDS = ["emerald", "amber", "rose", "noir", "clear"];
const WIDTH = 960;
const HEIGHT = 1200; // the 4:5 frame the hero gives the bottle
const ANGLE = 0.2;

const entry = `
import { mountBottle } from "./src/components/home/bottle/scene";
// Keep the frame readable after it is presented.
const getContext = HTMLCanvasElement.prototype.getContext;
let gl = null;
HTMLCanvasElement.prototype.getContext = function (type, attrs) {
  const ctx = getContext.call(this, type, { ...attrs, preserveDrawingBuffer: true });
  if (type.startsWith("webgl")) gl = ctx;
  return ctx;
};
const q = new URLSearchParams(location.search);
const canvas = document.getElementById("c");
window.__ready = false;
mountBottle(canvas, { liquid: q.get("liquid"), motion: false, lowPower: false, angle: Number(q.get("angle")), monogramUrl: "/monogram.png", onReady: () => setTimeout(() => (window.__ready = true), 300) });
// The canvas holds premultiplied colour, and the glow layers add light without
// adding alpha. Fold that light into alpha so it survives as a normal image
// (identical over a dark background, which is where the hero shows it).
window.__capture = () => {
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  const px = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const out = new ImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = ((h - 1 - y) * w + x) * 4, o = (y * w + x) * 4;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const a = Math.max(px[i + 3], r, g, b);
      if (!a) continue;
      out.data[o] = Math.min(255, Math.round((r * 255) / a));
      out.data[o + 1] = Math.min(255, Math.round((g * 255) / a));
      out.data[o + 2] = Math.min(255, Math.round((b * 255) / a));
      out.data[o + 3] = a;
    }
  }
  const c2 = document.createElement("canvas");
  c2.width = w; c2.height = h;
  c2.getContext("2d").putImageData(out, 0, 0);
  return c2.toDataURL("image/webp", 0.86);
};
`;

const bundle = await build({
  stdin: { contents: entry, resolveDir: root, loader: "ts" },
  bundle: true,
  format: "iife",
  write: false,
  logLevel: "warning",
});
const js = bundle.outputFiles[0].text;
const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}#c{width:${WIDTH}px;height:${HEIGHT}px;display:block}</style><canvas id="c"></canvas><script src="/b.js"></script>`;
const monogram = readFileSync(path.join(root, "public/images/brand/hc-monogram.png"));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.route("http://render.local/**", (route) => {
  const url = new URL(route.request().url());
  if (url.pathname === "/b.js") return route.fulfill({ body: js, contentType: "text/javascript" });
  if (url.pathname === "/monogram.png") return route.fulfill({ body: monogram, contentType: "image/png" });
  return route.fulfill({ body: html, contentType: "text/html" });
});

for (const liquid of LIQUIDS) {
  await page.goto(`http://render.local/?liquid=${liquid}&angle=${ANGLE}`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 30000 });
  const dataUrl = await page.evaluate(() => window.__capture());
  const file = path.join(root, `public/images/editorial/bottle-${liquid}.webp`);
  writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log("wrote", path.relative(root, file));
}
await browser.close();
