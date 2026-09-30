/**
 * SQLite implementation of the Store contract, using Node's built-in
 * `node:sqlite` (Node 22.5+). The whole database is one file
 * (server/.data/ya2.db by default) that any SQL tool can open.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { ContactRecord, PaymentRecord, ResetRecord, SessionRecord, ShipmentRecord, Store, UserRecord } from './types';
import type { ActivityItem, ActivityType, Address, PartyDetails, SavedQuote, ShipmentEvent } from '../../src/lib/apiTypes';

type Row = Record<string, SQLInputValue>;
const here = path.dirname(fileURLToPath(import.meta.url));

export function createSqliteStore(file: string): Store {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);

  const all = (sql: string, ...args: SQLInputValue[]) => db.prepare(sql).all(...args) as Row[];
  const get = (sql: string, ...args: SQLInputValue[]) => (db.prepare(sql).get(...args) as Row | undefined) ?? null;
  const run = (sql: string, ...args: SQLInputValue[]) => db.prepare(sql).run(...args);
  const tx = <T>(fn: () => T): T => {
    db.exec('BEGIN');
    try {
      const out = fn();
      db.exec('COMMIT');
      return out;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  };
  const str = (v: SQLInputValue) => (v === null || v === undefined ? null : String(v));

  const toUser = (r: Row | null): UserRecord | null =>
    r && {
      id: String(r.id),
      name: String(r.name),
      email: String(r.email),
      phone: str(r.phone),
      passwordHash: str(r.password_hash),
      googleId: str(r.google_id),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };

  const toAddress = (r: Row): Address => ({
    id: String(r.id),
    label: String(r.label),
    name: String(r.name),
    phone: String(r.phone),
    line1: String(r.line1),
    city: String(r.city),
    state: String(r.state),
    pincode: String(r.pincode),
    createdAt: String(r.created_at),
  });

  const toQuote = (r: Row): SavedQuote => ({
    id: String(r.id),
    mode: r.mode as SavedQuote['mode'],
    pickupState: String(r.pickup_state),
    destinationState: String(r.destination_state),
    pickupCity: str(r.pickup_city) ?? undefined,
    destinationCity: str(r.destination_city) ?? undefined,
    weightKg: Number(r.weight_kg),
    cargoType: r.cargo_type as SavedQuote['cargoType'],
    speed: r.speed as SavedQuote['speed'],
    total: Number(r.total),
    transitLabel: String(r.transit_label),
    createdAt: String(r.created_at),
  });

  const party = (r: Row, p: 'sender' | 'receiver'): PartyDetails => ({
    name: String(r[`${p}_name`]),
    phone: String(r[`${p}_phone`]),
    address: String(r[`${p}_address`]),
    city: String(r[`${p}_city`]),
    state: String(r[`${p}_state`]),
    pincode: String(r[`${p}_pincode`]),
  });

  const events = (id: string): ShipmentEvent[] =>
    all('SELECT stage, event_at, location, note FROM shipment_events WHERE shipment_id = ? ORDER BY event_at, id', id).map((e) => ({
      stage: e.stage as ShipmentEvent['stage'],
      at: String(e.event_at),
      location: String(e.location),
      note: str(e.note) ?? undefined,
    }));

  const toShipment = (r: Row | null): ShipmentRecord | null =>
    r && {
      id: String(r.id),
      userId: String(r.user_id),
      bookingId: String(r.booking_id),
      trackingId: str(r.tracking_id),
      status: r.status as ShipmentRecord['status'],
      mode: r.mode as ShipmentRecord['mode'],
      speed: r.speed as ShipmentRecord['speed'],
      cargoType: r.cargo_type as ShipmentRecord['cargoType'],
      weightKg: Number(r.weight_kg),
      sender: party(r, 'sender'),
      receiver: party(r, 'receiver'),
      price: Number(r.price),
      breakdown: JSON.parse(String(r.breakdown_json)),
      estimatedDelivery: str(r.estimated_delivery),
      events: events(String(r.id)),
      createdAt: String(r.created_at),
      paidAt: str(r.paid_at),
    };

  const writeEvents = (id: string, list: ShipmentEvent[]) => {
    run('DELETE FROM shipment_events WHERE shipment_id = ?', id);
    for (const e of list) run('INSERT INTO shipment_events (shipment_id, stage, event_at, location, note) VALUES (?, ?, ?, ?, ?)', id, e.stage, e.at, e.location, e.note ?? null);
  };

  const toPayment = (r: Row | null): PaymentRecord | null =>
    r && {
      id: String(r.id),
      shipmentId: String(r.shipment_id),
      userId: String(r.user_id),
      provider: r.provider as PaymentRecord['provider'],
      orderId: String(r.order_id),
      amount: Number(r.amount),
      status: r.status as PaymentRecord['status'],
      method: str(r.method),
      providerPaymentId: str(r.provider_payment_id),
      createdAt: String(r.created_at),
      paidAt: str(r.paid_at),
    };

  /** Builds "SET a = ?, b = ?" for the keys present in `patch`. */
  const setClause = (patch: Record<string, unknown>, cols: Record<string, string>, conv: Record<string, (v: unknown) => SQLInputValue> = {}) => {
    const sets: string[] = [];
    const vals: SQLInputValue[] = [];
    for (const [k, col] of Object.entries(cols)) {
      if (k in patch) {
        sets.push(`${col} = ?`);
        vals.push(conv[k] ? conv[k](patch[k]) : ((patch[k] ?? null) as SQLInputValue));
      }
    }
    return { sets, vals };
  };

  return {
    async init() {
      db.exec(fs.readFileSync(path.join(here, 'schema.sqlite.sql'), 'utf8'));
      db.exec('PRAGMA journal_mode = WAL');
      run('DELETE FROM sessions WHERE expires_at < ?', new Date().toISOString());
    },
    async close() {
      db.close();
    },

    users: {
      findById: async (id) => toUser(get('SELECT * FROM users WHERE id = ?', id)),
      findByEmail: async (email) => toUser(get('SELECT * FROM users WHERE email = ?', email.toLowerCase())),
      findByGoogleId: async (g) => toUser(get('SELECT * FROM users WHERE google_id = ?', g)),
      async create(u) {
        run(
          'INSERT INTO users (id, name, email, phone, password_hash, google_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          u.id, u.name, u.email, u.phone, u.passwordHash, u.googleId, u.createdAt, u.updatedAt,
        );
        return u;
      },
      async update(id, patch) {
        const { sets, vals } = setClause(patch, { name: 'name', email: 'email', phone: 'phone', passwordHash: 'password_hash', googleId: 'google_id' });
        sets.push('updated_at = ?');
        vals.push(new Date().toISOString());
        run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, ...vals, id);
        return toUser(get('SELECT * FROM users WHERE id = ?', id));
      },
    },

    sessions: {
      async create(s: SessionRecord) {
        run('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)', s.tokenHash, s.userId, s.expiresAt, s.createdAt);
      },
      async find(t) {
        const r = get('SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?', t, new Date().toISOString());
        return r && { tokenHash: String(r.token_hash), userId: String(r.user_id), expiresAt: String(r.expires_at), createdAt: String(r.created_at) };
      },
      async delete(t) {
        run('DELETE FROM sessions WHERE token_hash = ?', t);
      },
      async deleteForUser(u, except) {
        run('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?', u, except ?? '');
      },
    },

    resets: {
      async create(r: ResetRecord) {
        run('INSERT INTO password_resets (token_hash, user_id, expires_at, used_at) VALUES (?, ?, ?, ?)', r.tokenHash, r.userId, r.expiresAt, r.usedAt);
      },
      async find(t) {
        const r = get('SELECT * FROM password_resets WHERE token_hash = ?', t);
        return r && { tokenHash: String(r.token_hash), userId: String(r.user_id), expiresAt: String(r.expires_at), usedAt: str(r.used_at) };
      },
      async markUsed(t) {
        run('UPDATE password_resets SET used_at = ? WHERE token_hash = ?', new Date().toISOString(), t);
      },
    },

    addresses: {
      list: async (u) => all('SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at', u).map(toAddress),
      async create(u, a) {
        run(
          'INSERT INTO addresses (id, user_id, label, name, phone, line1, city, state, pincode, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          a.id, u, a.label, a.name, a.phone, a.line1, a.city, a.state, a.pincode, a.createdAt,
        );
        return a;
      },
      async update(u, id, a) {
        run(
          'UPDATE addresses SET label = ?, name = ?, phone = ?, line1 = ?, city = ?, state = ?, pincode = ? WHERE id = ? AND user_id = ?',
          a.label, a.name, a.phone, a.line1, a.city, a.state, a.pincode, id, u,
        );
        const r = get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', id, u);
        return r ? toAddress(r) : null;
      },
      async delete(u, id) {
        return Number(run('DELETE FROM addresses WHERE id = ? AND user_id = ?', id, u).changes) > 0;
      },
    },

    quotes: {
      list: async (u) => all('SELECT * FROM quotes WHERE user_id = ? ORDER BY created_at DESC', u).map(toQuote),
      async create(u, q) {
        run(
          `INSERT INTO quotes (id, user_id, mode, pickup_state, destination_state, pickup_city, destination_city, weight_kg, cargo_type, speed, total, transit_label, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          q.id, u, q.mode, q.pickupState, q.destinationState, q.pickupCity ?? null, q.destinationCity ?? null, q.weightKg, q.cargoType, q.speed, q.total, q.transitLabel, q.createdAt,
        );
        return q;
      },
      async delete(u, id) {
        return Number(run('DELETE FROM quotes WHERE id = ? AND user_id = ?', id, u).changes) > 0;
      },
    },

    shipments: {
      async create(s) {
        tx(() => {
          run(
            `INSERT INTO shipments (id, user_id, booking_id, tracking_id, status, mode, speed, cargo_type, weight_kg,
               sender_name, sender_phone, sender_address, sender_city, sender_state, sender_pincode,
               receiver_name, receiver_phone, receiver_address, receiver_city, receiver_state, receiver_pincode,
               price, breakdown_json, estimated_delivery, created_at, paid_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            s.id, s.userId, s.bookingId, s.trackingId, s.status, s.mode, s.speed, s.cargoType, s.weightKg,
            s.sender.name, s.sender.phone, s.sender.address, s.sender.city, s.sender.state, s.sender.pincode,
            s.receiver.name, s.receiver.phone, s.receiver.address, s.receiver.city, s.receiver.state, s.receiver.pincode,
            s.price, JSON.stringify(s.breakdown), s.estimatedDelivery, s.createdAt, s.paidAt,
          );
          writeEvents(s.id, s.events);
        });
        return s;
      },
      findById: async (id) => toShipment(get('SELECT * FROM shipments WHERE id = ?', id)),
      findByTrackingId: async (t) => toShipment(get('SELECT * FROM shipments WHERE tracking_id = ?', t)),
      listByUser: async (u) => all('SELECT * FROM shipments WHERE user_id = ? ORDER BY created_at DESC', u).map((r) => toShipment(r)!),
      async update(id, patch) {
        tx(() => {
          const { sets, vals } = setClause(patch as Record<string, unknown>, {
            trackingId: 'tracking_id',
            status: 'status',
            estimatedDelivery: 'estimated_delivery',
            paidAt: 'paid_at',
          });
          if (sets.length) run(`UPDATE shipments SET ${sets.join(', ')} WHERE id = ?`, ...vals, id);
          if (patch.events) writeEvents(id, patch.events);
        });
        return toShipment(get('SELECT * FROM shipments WHERE id = ?', id));
      },
      async nextTrackingSequence() {
        return tx(() => {
          run("UPDATE counters SET value = value + 1 WHERE name = 'tracking_seq'");
          return Number(get("SELECT value FROM counters WHERE name = 'tracking_seq'")!.value);
        });
      },
    },

    payments: {
      async create(p) {
        run(
          `INSERT INTO payments (id, shipment_id, user_id, provider, order_id, amount, status, method, provider_payment_id, created_at, paid_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          p.id, p.shipmentId, p.userId, p.provider, p.orderId, p.amount, p.status, p.method, p.providerPaymentId, p.createdAt, p.paidAt,
        );
        return p;
      },
      findByOrderId: async (o) => toPayment(get('SELECT * FROM payments WHERE order_id = ?', o)),
      async update(id, patch) {
        const { sets, vals } = setClause(patch as Record<string, unknown>, {
          status: 'status',
          method: 'method',
          providerPaymentId: 'provider_payment_id',
          paidAt: 'paid_at',
        });
        if (sets.length) run(`UPDATE payments SET ${sets.join(', ')} WHERE id = ?`, ...vals, id);
        return toPayment(get('SELECT * FROM payments WHERE id = ?', id));
      },
    },

    contact: {
      async create(m: ContactRecord) {
        run(
          'INSERT INTO contact_messages (id, name, email, phone, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          m.id, m.name, m.email, m.phone, m.subject, m.message, m.createdAt,
        );
        return m;
      },
    },

    activity: {
      async add(userId, a) {
        run('INSERT INTO activity (id, user_id, type, title, detail, ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', a.id, userId, a.type, a.title, a.detail, a.ref, a.createdAt);
      },
      async list(userId, limit) {
        return all('SELECT * FROM activity WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', userId, limit).map(
          (r): ActivityItem => ({ id: String(r.id), type: r.type as ActivityType, title: String(r.title), detail: str(r.detail), ref: str(r.ref), createdAt: String(r.created_at) }),
        );
      },
    },
  };
}
