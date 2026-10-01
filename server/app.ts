/**
 * The Express app: security headers, API routes, error handler, and the built
 * website (dist/) when present. server/index.ts runs it as a normal server;
 * server/vercel.ts exposes it as a Vercel serverless function.
 */
import path from 'node:path';
import fs from 'node:fs';
import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { ENV } from './env';
import { initStore } from './db';
import { loadUser } from './auth/auth';
import { HttpError } from './lib/http';
import { authRouter } from './routes/auth';
import { accountRouter } from './routes/account';
import { shipmentsRouter } from './routes/shipments';
import { adminRouter } from './routes/admin';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

/** State-changing API calls must be JSON — together with SameSite cookies this blocks CSRF form posts. */
const jsonOnly: RequestHandler = (req, _res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !req.is('application/json')) {
    return next(new HttpError(415, 'Requests must be sent as JSON.'));
  }
  next();
};

const api = express.Router();
api.use(express.json({ limit: '100kb' }), jsonOnly, loadUser);
api.get('/health', (_req, res) => res.json({ ok: true, db: ENV.dbClient }));
api.use('/auth', authRouter);
api.use(accountRouter);
api.use(shipmentsRouter);
api.use(adminRouter);
api.use((_req, _res, next) => next(new HttpError(404, 'Not found.')));
app.use('/api', api);

// Production: serve the built SPA with history-API fallback.
const dist = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, fields: err.fields });
  }
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
};
app.use(onError);

let starting: Promise<unknown> | null = null;
/** Connects the database once (creates tables on first use). */
export const ready = () =>
  (starting ??= initStore().catch((e) => {
    starting = null; // try again on the next request
    throw e;
  }));
