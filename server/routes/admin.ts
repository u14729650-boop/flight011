/**
 * Hidden admin console API (/api/admin/*).
 *
 * - Protected by ADMIN_PASSWORD (separate from customer accounts). If it is
 *   not set outside production, a random one is generated and printed in the
 *   server log at startup; in production the console is disabled until set.
 * - Browsing and the SQL console read the SQLite database through a separate
 *   READ-ONLY connection, so nothing here can change data.
 * - Password hashes and session/reset tokens are never returned.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { Router, type RequestHandler } from 'express';
import { ENV } from '../env';
import { HttpError, rateLimit, route, str } from '../lib/http';

export const adminRouter = Router();

let adminPassword = process.env.ADMIN_PASSWORD ?? '';
if (!adminPassword && !ENV.isProd) {
  adminPassword = crypto.randomBytes(9).toString('base64url');
  console.info(`\n[admin] ADMIN_PASSWORD not set — using a temporary one for this run: ${adminPassword}\n`);
}

const COOKIE = 'ya2_admin';
const TTL = 8 * 3600_000;
const sessions = new Map<string, number>(); // sha256(token) → expiry

const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const readCookie = (raw: string | undefined) => {
  for (const part of (raw ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return decodeURIComponent(v.join('='));
  }
  return null;
};

const requireAdmin: RequestHandler = (req, _res, next) => {
  const t = readCookie(req.headers.cookie);
  const exp = t ? sessions.get(sha(t)) : undefined;
  if (!exp || exp < Date.now()) return next(new HttpError(401, 'Admin login required.'));
  next();
};

/** Hidden columns — never leave the server. */
const SECRET_COLUMNS = /^(password_hash|token_hash)$/;

/** Tables the console can browse, with the columns shown (in order). */
const TABLES: Record<string, { label: string; columns: string[]; order: string }> = {
  contact_messages: { label: 'Enquiries', columns: ['created_at', 'name', 'email', 'phone', 'subject', 'message'], order: 'created_at DESC' },
  users: { label: 'Users', columns: ['created_at', 'name', 'email', 'phone', 'google_id', 'id'], order: 'created_at DESC' },
  shipments: {
    label: 'Shipments',
    columns: ['created_at', 'booking_id', 'tracking_id', 'status', 'mode', 'speed', 'cargo_type', 'weight_kg', 'price', 'sender_name', 'sender_phone', 'sender_city', 'sender_state', 'sender_pincode', 'receiver_name', 'receiver_phone', 'receiver_city', 'receiver_state', 'receiver_pincode', 'estimated_delivery', 'paid_at'],
    order: 'created_at DESC',
  },
  payments: { label: 'Payments', columns: ['created_at', 'order_id', 'amount', 'method', 'status', 'provider', 'provider_payment_id', 'paid_at', 'shipment_id'], order: 'created_at DESC' },
  quotes: { label: 'Saved quotes', columns: ['created_at', 'mode', 'pickup_city', 'pickup_state', 'destination_city', 'destination_state', 'weight_kg', 'cargo_type', 'speed', 'total', 'transit_label'], order: 'created_at DESC' },
  addresses: { label: 'Addresses', columns: ['created_at', 'label', 'name', 'phone', 'line1', 'city', 'state', 'pincode'], order: 'created_at DESC' },
  shipment_events: { label: 'Tracking events', columns: ['event_at', 'shipment_id', 'stage', 'location', 'note'], order: 'event_at DESC' },
};

function readonlyDb(): DatabaseSync {
  if (ENV.dbClient !== 'sqlite') throw new HttpError(501, 'The admin console reads the SQLite database. Set DB_CLIENT=sqlite.');
  if (!fs.existsSync(ENV.sqliteFile)) throw new HttpError(404, 'The database has not been created yet.');
  return new DatabaseSync(ENV.sqliteFile, { readOnly: true });
}

/** Secret values are masked by column name and by shape, so an alias (`SELECT password_hash AS x`) can't reveal them. */
const SECRET_VALUE = /^(scrypt\$|[0-9a-f]{64}$)/;
const clean = (rows: Record<string, unknown>[]) =>
  rows.map((r) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, SECRET_COLUMNS.test(k) || (typeof v === 'string' && SECRET_VALUE.test(v)) ? '•••• hidden' : v])),
  );

adminRouter.get('/admin/status', (req, res) => {
  const t = readCookie(req.headers.cookie);
  const exp = t ? sessions.get(sha(t)) : undefined;
  res.json({ enabled: Boolean(adminPassword), signedIn: Boolean(exp && exp > Date.now()), database: ENV.dbClient });
});

adminRouter.post(
  '/admin/login',
  rateLimit('admin-login', 6, 60_000),
  route(async (req, res) => {
    if (!adminPassword) throw new HttpError(503, 'Admin console is disabled. Set ADMIN_PASSWORD on the server.');
    const given = Buffer.from(sha(str(req.body.password, 200)));
    const expected = Buffer.from(sha(adminPassword));
    if (!crypto.timingSafeEqual(given, expected)) throw new HttpError(401, 'Incorrect admin password.');
    const token = crypto.randomBytes(32).toString('base64url');
    sessions.set(sha(token), Date.now() + TTL);
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: ENV.isProd, maxAge: TTL, path: '/api/admin' });
    res.json({ ok: true });
  }),
);

adminRouter.post('/admin/logout', (req, res) => {
  const t = readCookie(req.headers.cookie);
  if (t) sessions.delete(sha(t));
  res.clearCookie(COOKIE, { path: '/api/admin' });
  res.json({ ok: true });
});

adminRouter.get(
  '/admin/overview',
  requireAdmin,
  route(async (_req, res) => {
    const db = readonlyDb();
    try {
      const counts = Object.fromEntries(
        Object.keys(TABLES).map((t) => [t, Number((db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n)]),
      );
      const revenue = Number((db.prepare("SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE status = 'PAID'").get() as { s: number }).s);
      const byStatus = db.prepare('SELECT status, COUNT(*) AS n FROM shipments GROUP BY status ORDER BY n DESC').all();
      res.json({ counts, revenue, byStatus, tables: Object.fromEntries(Object.entries(TABLES).map(([k, v]) => [k, v.label])) });
    } finally {
      db.close();
    }
  }),
);

adminRouter.get(
  '/admin/table/:name',
  requireAdmin,
  route(async (req, res) => {
    const name = String(req.params.name);
    const def = TABLES[name];
    if (!def) throw new HttpError(404, 'Unknown table.');
    const db = readonlyDb();
    try {
      const rows = db.prepare(`SELECT ${def.columns.join(', ')} FROM ${name} ORDER BY ${def.order} LIMIT 1000`).all() as Record<string, unknown>[];
      res.json({ table: name, label: def.label, columns: def.columns, rows: clean(rows) });
    } finally {
      db.close();
    }
  }),
);

adminRouter.post(
  '/admin/sql',
  requireAdmin,
  route(async (req, res) => {
    const sql = str(req.body.sql, 5000).replace(/;\s*$/, '');
    if (!/^\s*(select|with)\b/i.test(sql)) throw new HttpError(400, 'Only SELECT queries are allowed in the console.');
    if (sql.includes(';')) throw new HttpError(400, 'Run one query at a time.');
    const db = readonlyDb();
    try {
      const started = performance.now();
      const stmt = db.prepare(sql);
      const rows = (stmt.all() as Record<string, SQLInputValue>[]).slice(0, 500);
      const columns = rows[0] ? Object.keys(rows[0]) : stmt.columns().map((c) => c.name);
      res.json({ columns, rows: clean(rows), ms: Math.round(performance.now() - started), truncated: rows.length === 500 });
    } catch (e) {
      if (e instanceof HttpError) throw e;
      throw new HttpError(400, e instanceof Error ? `SQL error: ${e.message}` : 'SQL error.');
    } finally {
      db.close();
    }
  }),
);
