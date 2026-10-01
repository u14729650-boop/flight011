/**
 * Builds the whole site for Vercel using the Build Output API
 * (https://vercel.com/docs/build-output-api/v3):
 *   .vercel/output/static/          the website (vite build)
 *   .vercel/output/functions/api.func  the Express API as one Node.js function
 * Vercel runs this via vercel.json → "buildCommand": "npm run build:vercel".
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const out = '.vercel/output';
const fn = `${out}/functions/api.func`;
fs.rmSync(out, { recursive: true, force: true });

// 1. Website
execSync('npm run build', { stdio: 'inherit' });
fs.cpSync('dist', `${out}/static`, { recursive: true });

// 2. API: one bundled ES module. oracledb stays a real package (it loads files at runtime).
await build({
  entryPoints: ['server/vercel.ts'],
  outfile: `${fn}/index.mjs`,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  external: ['oracledb'],
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  logLevel: 'warning',
});
// Table definitions are read next to the bundle (see schemaStatements / sqliteStore init).
for (const f of ['schema.oracle.sql', 'schema.sqlite.sql']) fs.copyFileSync(path.join('server/db', f), path.join(fn, f));
if (fs.existsSync('node_modules/oracledb')) {
  fs.cpSync('node_modules/oracledb', `${fn}/node_modules/oracledb`, {
    recursive: true,
    filter: (src) => !/[\\/](build|src|test|examples)([\\/]|$)/.test(src.replace(path.resolve('node_modules/oracledb'), '')),
  });
}
fs.writeFileSync(`${fn}/package.json`, JSON.stringify({ type: 'module' }));
fs.writeFileSync(
  `${fn}/.vc-config.json`,
  JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', shouldAddHelpers: false, maxDuration: 30 }, null, 2),
);

// 3. Routing: /api/* → the function, real files as-is, everything else → the single-page app.
fs.writeFileSync(
  `${out}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: '/api/(.*)', dest: '/api' },
        { src: '/assets/(.*)', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, continue: true },
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/index.html' },
      ],
    },
    null,
    2,
  ),
);
console.log(`Vercel build ready in ${out}`);
