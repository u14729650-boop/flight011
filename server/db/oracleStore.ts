/**
 * Oracle Database implementation of the Store contract (node-oracledb, thin mode).
 *
 * On first start it creates the tables from schema.oracle.sql if they are not
 * there yet, so an empty Oracle schema is all you need.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ContactRecord, PaymentRecord, ResetRecord, SessionRecord, ShipmentRecord, Store, UserRecord } from './types';
import type { ActivityItem, Address, SavedQuote, ShipmentEvent } from '../../src/lib/apiTypes';
import { ENV } from '../env';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const here = path.dirname(fileURLToPath(import.meta.url));

/** schema.oracle.sql split into single statements (Oracle runs one per execute, without the trailing semicolon). */
function schemaStatements(): string[] {
  return fs
    .readFileSync(path.join(here, 'schema.oracle.sql'), 'utf8')
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharedPool: any = null;

/** Runs one SELECT inside a READ ONLY transaction (used by the hidden admin console). Keys come back lower-case. */
export async function oracleReadOnly(sql: string, maxRows = 500): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
  if (!sharedPool) throw new Error('Oracle is not connected.');
  const conn = await sharedPool.getConnection();
  try {
    await conn.execute('SET TRANSACTION READ ONLY');
    const r = await conn.execute(sql, {}, { maxRows, autoCommit: false });
    const columns: string[] = (r.metaData ?? []).map((m: { name: string }) => m.name.toLowerCase());
    const rows = ((r.rows ?? []) as Record<string, unknown>[]).map((row) =>
      Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v instanceof Date ? v.toISOString() : v])),
    );
    return { columns, rows };
  } finally {
    await conn.rollback().catch(() => {});
    await conn.close();
  }
}

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);
const ts = (s: string | null | undefined) => (s ? new Date(s) : null);

export async function createOracleStore(): Promise<Store> {
  // Loaded lazily so the dependency is only needed when Oracle is in use.
  const mod: any = await import('oracledb');
  const oracledb = mod.default ?? mod;
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  oracledb.fetchAsString = [oracledb.CLOB];
  oracledb.autoCommit = true;

  const pool = await oracledb.createPool({
    user: ENV.oracle.user,
    password: ENV.oracle.password,
    connectString: ENV.oracle.connectString,
    ...(ENV.oracle.walletDir
      ? { configDir: ENV.oracle.walletDir, walletLocation: ENV.oracle.walletDir, walletPassword: ENV.oracle.walletPassword }
      : {}),
    poolMin: 1,
    poolMax: 8,
  });
  sharedPool = pool;

  async function q<T = Row>(sql: string, binds: Row = {}): Promise<T[]> {
    const conn = await pool.getConnection();
    try {
      const r = await conn.execute(sql, binds);
      return (r.rows ?? []) as T[];
    } finally {
      await conn.close();
    }
  }
  const one = async <T = Row>(sql: string, binds: Row = {}) => (await q<T>(sql, binds))[0] ?? null;

  const toUser = (r: Row | null): UserRecord | null =>
    r && {
      id: r.ID,
      name: r.NAME,
      email: r.EMAIL,
      phone: r.PHONE,
      passwordHash: r.PASSWORD_HASH,
      googleId: r.GOOGLE_ID,
      createdAt: iso(r.CREATED_AT)!,
      updatedAt: iso(r.UPDATED_AT)!,
    };

  const toAddress = (r: Row): Address => ({
    id: r.ID,
    label: r.LABEL,
    name: r.NAME,
    phone: r.PHONE,
    line1: r.LINE1,
    city: r.CITY,
    state: r.STATE,
    pincode: r.PINCODE,
    createdAt: iso(r.CREATED_AT)!,
  });

  const toQuote = (r: Row): SavedQuote => ({
    id: r.ID,
    mode: r.MODE_CODE,
    pickupState: r.PICKUP_STATE,
    destinationState: r.DESTINATION_STATE,
    pickupCity: r.PICKUP_CITY ?? undefined,
    destinationCity: r.DESTINATION_CITY ?? undefined,
    weightKg: Number(r.WEIGHT_KG),
    cargoType: r.CARGO_TYPE,
    speed: r.SPEED,
    total: Number(r.TOTAL),
    transitLabel: r.TRANSIT_LABEL,
    createdAt: iso(r.CREATED_AT)!,
  });

  async function loadEvents(shipmentId: string): Promise<ShipmentEvent[]> {
    const rows = await q(
      `SELECT stage, event_at, location, note FROM ya2_shipment_events WHERE shipment_id = :id ORDER BY event_at`,
      { id: shipmentId },
    );
    return rows.map((r) => ({ stage: r.STAGE, at: iso(r.EVENT_AT)!, location: r.LOCATION, note: r.NOTE ?? undefined }));
  }

  async function toShipment(r: Row | null): Promise<ShipmentRecord | null> {
    if (!r) return null;
    return {
      id: r.ID,
      userId: r.USER_ID,
      bookingId: r.BOOKING_ID,
      trackingId: r.TRACKING_ID,
      status: r.STATUS,
      mode: r.MODE_CODE,
      speed: r.SPEED,
      cargoType: r.CARGO_TYPE,
      weightKg: Number(r.WEIGHT_KG),
      sender: JSON.parse(r.SENDER_JSON),
      receiver: JSON.parse(r.RECEIVER_JSON),
      breakdown: JSON.parse(r.BREAKDOWN_JSON),
      price: Number(r.PRICE),
      estimatedDelivery: iso(r.ESTIMATED_DELIVERY),
      events: await loadEvents(r.ID),
      createdAt: iso(r.CREATED_AT)!,
      paidAt: iso(r.PAID_AT),
    };
  }

  async function replaceEvents(shipmentId: string, events: ShipmentEvent[]) {
    await q(`DELETE FROM ya2_shipment_events WHERE shipment_id = :id`, { id: shipmentId });
    for (const e of events) {
      await q(
        `INSERT INTO ya2_shipment_events (shipment_id, stage, event_at, location, note) VALUES (:sid, :stage, :at, :loc, :note)`,
        { sid: shipmentId, stage: e.stage, at: ts(e.at), loc: e.location, note: e.note ?? null },
      );
    }
  }

  const toPayment = (r: Row | null): PaymentRecord | null =>
    r && {
      id: r.ID,
      shipmentId: r.SHIPMENT_ID,
      userId: r.USER_ID,
      provider: r.PROVIDER,
      orderId: r.ORDER_ID,
      amount: Number(r.AMOUNT),
      status: r.STATUS,
      method: r.METHOD,
      providerPaymentId: r.PROVIDER_PAYMENT_ID,
      createdAt: iso(r.CREATED_AT)!,
      paidAt: iso(r.PAID_AT),
    };

  return {
    async init() {
      // Creates whatever tables are missing: all of them on first start, or tables added in later versions (e.g. ya2_activity).
      const existing = new Set((await q(`SELECT table_name FROM user_tables`)).map((r) => String(r.TABLE_NAME)));
      const stmts = schemaStatements();
      const tableOf = (stmt: string) => /^CREATE\s+(?:TABLE|INDEX\s+\w+\s+ON)\s+(\w+)/i.exec(stmt)?.[1]?.toUpperCase();
      const missing = new Set(stmts.map(tableOf).filter((t): t is string => Boolean(t) && !existing.has(t!)));
      if (!missing.size) return;
      console.info(`[oracle] Creating tables: ${[...missing].map((t) => t.toLowerCase()).join(', ')}`);
      for (const stmt of stmts) {
        const t = tableOf(stmt);
        if (t ? missing.has(t) : !existing.has('YA2_USERS')) await q(stmt); // the tracking sequence is created with the first install
      }
      console.info('[oracle] Tables ready.');
    },
    async close() {
      sharedPool = null;
      await pool.close(5);
    },

    users: {
      findById: async (id) => toUser(await one(`SELECT * FROM ya2_users WHERE id = :id`, { id })),
      findByEmail: async (email) => toUser(await one(`SELECT * FROM ya2_users WHERE email = :e`, { e: email.toLowerCase() })),
      findByGoogleId: async (g) => toUser(await one(`SELECT * FROM ya2_users WHERE google_id = :g`, { g })),
      async create(u) {
        await q(
          `INSERT INTO ya2_users (id, name, email, phone, password_hash, google_id, created_at, updated_at)
           VALUES (:id, :name, :email, :phone, :ph, :gid, :ca, :ua)`,
          { id: u.id, name: u.name, email: u.email, phone: u.phone, ph: u.passwordHash, gid: u.googleId, ca: ts(u.createdAt), ua: ts(u.updatedAt) },
        );
        return u;
      },
      async update(id, p) {
        const cols: Record<string, string> = { name: 'name', email: 'email', phone: 'phone', passwordHash: 'password_hash', googleId: 'google_id' };
        const sets: string[] = ['updated_at = SYSTIMESTAMP'];
        const binds: Row = { id };
        for (const [k, col] of Object.entries(cols)) {
          if (k in p) {
            sets.push(`${col} = :${k}`);
            binds[k] = (p as Row)[k];
          }
        }
        await q(`UPDATE ya2_users SET ${sets.join(', ')} WHERE id = :id`, binds);
        return toUser(await one(`SELECT * FROM ya2_users WHERE id = :id`, { id }));
      },
    },

    sessions: {
      async create(s: SessionRecord) {
        await q(`INSERT INTO ya2_sessions (token_hash, user_id, expires_at, created_at) VALUES (:t, :u, :e, :c)`, {
          t: s.tokenHash, u: s.userId, e: ts(s.expiresAt), c: ts(s.createdAt),
        });
      },
      async find(t) {
        const r = await one(`SELECT * FROM ya2_sessions WHERE token_hash = :t AND expires_at > SYSTIMESTAMP`, { t });
        return r && { tokenHash: r.TOKEN_HASH, userId: r.USER_ID, expiresAt: iso(r.EXPIRES_AT)!, createdAt: iso(r.CREATED_AT)! };
      },
      async delete(t) {
        await q(`DELETE FROM ya2_sessions WHERE token_hash = :t`, { t });
      },
      async deleteForUser(u, except) {
        await q(`DELETE FROM ya2_sessions WHERE user_id = :u AND token_hash <> :x`, { u, x: except ?? '-' });
      },
    },

    resets: {
      async create(r: ResetRecord) {
        await q(`INSERT INTO ya2_password_resets (token_hash, user_id, expires_at) VALUES (:t, :u, :e)`, {
          t: r.tokenHash, u: r.userId, e: ts(r.expiresAt),
        });
      },
      async find(t) {
        const r = await one(`SELECT * FROM ya2_password_resets WHERE token_hash = :t`, { t });
        return r && { tokenHash: r.TOKEN_HASH, userId: r.USER_ID, expiresAt: iso(r.EXPIRES_AT)!, usedAt: iso(r.USED_AT) };
      },
      async markUsed(t) {
        await q(`UPDATE ya2_password_resets SET used_at = SYSTIMESTAMP WHERE token_hash = :t`, { t });
      },
    },

    addresses: {
      list: async (u) => (await q(`SELECT * FROM ya2_addresses WHERE user_id = :u ORDER BY created_at`, { u })).map(toAddress),
      async create(u, a) {
        await q(
          `INSERT INTO ya2_addresses (id, user_id, label, name, phone, line1, city, state, pincode, created_at)
           VALUES (:id, :u, :label, :name, :phone, :line1, :city, :state, :pin, :ca)`,
          { id: a.id, u, label: a.label, name: a.name, phone: a.phone, line1: a.line1, city: a.city, state: a.state, pin: a.pincode, ca: ts(a.createdAt) },
        );
        return a;
      },
      async update(u, id, a) {
        await q(
          `UPDATE ya2_addresses SET label=:label, name=:name, phone=:phone, line1=:line1, city=:city, state=:state, pincode=:pin
           WHERE id=:id AND user_id=:u`,
          { id, u, label: a.label, name: a.name, phone: a.phone, line1: a.line1, city: a.city, state: a.state, pin: a.pincode },
        );
        const r = await one(`SELECT * FROM ya2_addresses WHERE id = :id AND user_id = :u`, { id, u });
        return r ? toAddress(r) : null;
      },
      async delete(u, id) {
        const before = await one(`SELECT COUNT(*) AS n FROM ya2_addresses WHERE id = :id AND user_id = :u`, { id, u });
        await q(`DELETE FROM ya2_addresses WHERE id = :id AND user_id = :u`, { id, u });
        return Number(before?.N ?? 0) > 0;
      },
    },

    quotes: {
      list: async (u) => (await q(`SELECT * FROM ya2_quotes WHERE user_id = :u ORDER BY created_at DESC`, { u })).map(toQuote),
      async create(u, x) {
        await q(
          `INSERT INTO ya2_quotes (id, user_id, mode_code, pickup_state, destination_state, pickup_city, destination_city,
             weight_kg, cargo_type, speed, total, transit_label, created_at)
           VALUES (:id, :u, :m, :ps, :ds, :pc, :dc, :w, :ct, :sp, :t, :tl, :ca)`,
          {
            id: x.id, u, m: x.mode, ps: x.pickupState, ds: x.destinationState, pc: x.pickupCity ?? null, dc: x.destinationCity ?? null,
            w: x.weightKg, ct: x.cargoType, sp: x.speed, t: x.total, tl: x.transitLabel, ca: ts(x.createdAt),
          },
        );
        return x;
      },
      async delete(u, id) {
        const before = await one(`SELECT COUNT(*) AS n FROM ya2_quotes WHERE id = :id AND user_id = :u`, { id, u });
        await q(`DELETE FROM ya2_quotes WHERE id = :id AND user_id = :u`, { id, u });
        return Number(before?.N ?? 0) > 0;
      },
    },

    shipments: {
      async create(s) {
        await q(
          `INSERT INTO ya2_shipments (id, user_id, booking_id, tracking_id, status, mode_code, speed, cargo_type, weight_kg,
             pickup_state, destination_state, sender_json, receiver_json, breakdown_json, price, estimated_delivery, created_at, paid_at)
           VALUES (:id, :u, :b, :t, :st, :m, :sp, :ct, :w, :ps, :ds, :sj, :rj, :bj, :p, :ed, :ca, :pa)`,
          {
            id: s.id, u: s.userId, b: s.bookingId, t: s.trackingId, st: s.status, m: s.mode, sp: s.speed, ct: s.cargoType, w: s.weightKg,
            ps: s.sender.state, ds: s.receiver.state, sj: JSON.stringify(s.sender), rj: JSON.stringify(s.receiver),
            bj: JSON.stringify(s.breakdown), p: s.price, ed: ts(s.estimatedDelivery), ca: ts(s.createdAt), pa: ts(s.paidAt),
          },
        );
        await replaceEvents(s.id, s.events);
        return s;
      },
      findById: async (id) => toShipment(await one(`SELECT * FROM ya2_shipments WHERE id = :id`, { id })),
      findByTrackingId: async (t) => toShipment(await one(`SELECT * FROM ya2_shipments WHERE tracking_id = :t`, { t })),
      async listByUser(u) {
        const rows = await q(`SELECT * FROM ya2_shipments WHERE user_id = :u ORDER BY created_at DESC`, { u });
        return (await Promise.all(rows.map(toShipment))) as ShipmentRecord[];
      },
      async update(id, p) {
        const cols: Record<string, [string, (v: any) => any]> = {
          trackingId: ['tracking_id', (v) => v],
          status: ['status', (v) => v],
          estimatedDelivery: ['estimated_delivery', ts],
          paidAt: ['paid_at', ts],
        };
        const sets: string[] = [];
        const binds: Row = { id };
        for (const [k, [col, conv]] of Object.entries(cols)) {
          if (k in p) {
            sets.push(`${col} = :${k}`);
            binds[k] = conv((p as Row)[k]);
          }
        }
        if (sets.length) await q(`UPDATE ya2_shipments SET ${sets.join(', ')} WHERE id = :id`, binds);
        if (p.events) await replaceEvents(id, p.events);
        return toShipment(await one(`SELECT * FROM ya2_shipments WHERE id = :id`, { id }));
      },
      async nextTrackingSequence() {
        const r = await one(`SELECT ya2_tracking_seq.NEXTVAL AS n FROM dual`);
        return Number(r!.N);
      },
    },

    payments: {
      async create(p) {
        await q(
          `INSERT INTO ya2_payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at)
           VALUES (:id, :s, :u, :pr, :o, :a, :st, :m, :pp, :ca, :pa)`,
          {
            id: p.id, s: p.shipmentId, u: p.userId, pr: p.provider, o: p.orderId, a: p.amount, st: p.status, m: p.method,
            pp: p.providerPaymentId, ca: ts(p.createdAt), pa: ts(p.paidAt),
          },
        );
        return p;
      },
      findByOrderId: async (o) => toPayment(await one(`SELECT * FROM ya2_payments WHERE order_id = :o`, { o })),
      async update(id, p) {
        await q(
          `UPDATE ya2_payments SET status = NVL(:st, status), method = NVL(:m, method),
             provider_payment_id = NVL(:pp, provider_payment_id), paid_at = NVL(:pa, paid_at) WHERE id = :id`,
          { id, st: p.status ?? null, m: p.method ?? null, pp: p.providerPaymentId ?? null, pa: ts(p.paidAt ?? null) },
        );
        return toPayment(await one(`SELECT * FROM ya2_payments WHERE id = :id`, { id }));
      },
    },

    contact: {
      async create(m: ContactRecord) {
        await q(
          `INSERT INTO ya2_contact_messages (id, name, email, phone, subject, message, created_at) VALUES (:id, :n, :e, :p, :s, :m, :c)`,
          { id: m.id, n: m.name, e: m.email, p: m.phone, s: m.subject, m: m.message, c: ts(m.createdAt) },
        );
        return m;
      },
    },

    activity: {
      async add(userId, a) {
        await q(
          `INSERT INTO ya2_activity (id, user_id, type, title, detail, ref, created_at) VALUES (:id, :u, :t, :ti, :d, :r, :c)`,
          { id: a.id, u: userId, t: a.type, ti: a.title, d: a.detail, r: a.ref, c: ts(a.createdAt) },
        );
      },
      async list(userId, limit) {
        const rows = await q(`SELECT * FROM ya2_activity WHERE user_id = :u ORDER BY created_at DESC FETCH FIRST :n ROWS ONLY`, { u: userId, n: limit });
        return rows.map((r): ActivityItem => ({ id: r.ID, type: r.TYPE, title: r.TITLE, detail: r.DETAIL, ref: r.REF, createdAt: iso(r.CREATED_AT)! }));
      },
    },
  };
}
