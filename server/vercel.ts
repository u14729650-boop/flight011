/**
 * Vercel serverless entry: every /api/* request is handed to the Express app.
 * Bundled by scripts/build-vercel.mjs into .vercel/output/functions/api.func.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { app, ready } from './app';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await ready();
  } catch (e) {
    console.error('[vercel] database not ready', e);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'The database is not reachable. Check the DB_CLIENT / ORACLE_* settings in Vercel.' }));
    return;
  }
  app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
