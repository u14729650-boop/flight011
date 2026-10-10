// Builds a browser-only preview of the site (no server) into preview/dist/.
// Usage: node preview/build.mjs
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "preview/dist");
mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [path.join(root, "preview/main.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  outfile: path.join(dist, "app.js"),
  tsconfig: path.join(root, "tsconfig.json"),
  alias: {
    "next/link": path.join(root, "preview/shims/link.tsx"),
    "next/image": path.join(root, "preview/shims/image.tsx"),
    "next/navigation": path.join(root, "preview/shims/router.ts"),
    "next/font/google": path.join(root, "preview/shims/font.ts"),
  },
  define: { "process.env.NODE_ENV": '"production"' },
  banner: { js: "var process={env:{}};" },
  logLevel: "warning",
  logOverride: { "unsupported-directive": "silent" },
});

execFileSync("npx", ["@tailwindcss/cli", "-i", "src/app/globals.css", "-o", "preview/dist/app.css", "--minify"], { cwd: root, stdio: "inherit" });
const css = readFileSync(path.join(dist, "app.css"), "utf8");

writeFileSync(
  path.join(dist, "index.html"),
  `<title>Homies Choice</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Manrope:wght@400;500;600;700&display=swap">
<style>
:root{--font-cormorant:"Cormorant Garamond";--font-manrope:"Manrope";color-scheme:light}
${css}
</style>
<div id="hc-root"></div>
<script src="app.js"></script>
`,
);
console.log("Preview written to preview/dist/");
