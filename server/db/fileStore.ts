/**
 * Development / prototype store: a single JSON file written atomically.
 * Swap to Oracle with DB_CLIENT=oracle — see server/db/oracleStore.ts.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ContactRecord, PaymentRecord, ResetRecord, SessionRecord, ShipmentRecord, Store, UserRecord } from './types';
import type { Address, SavedQuote } from '../../src/lib/apiTypes';

interface Data {
  users: UserRecord[];
  sessions: SessionRecord[];
  resets: ResetRecord[];
  addresses: (Address & { userId: string })[];
  quotes: (SavedQuote & { userId: string })[];
  shipments: ShipmentRecord[];
  payments: PaymentRecord[];
  contact: ContactRecord[];
  trackingSeq: number;
}

const empty = (): Data => ({
  users: [],
  sessions: [],
  resets: [],
  addresses: [],
  quotes: [],
  shipments: [],
  payments: [],
  contact: [],
  trackingSeq: 1400,
});

const strip = <T extends { userId?: string }>(r: T) => {
  const { userId: _u, ...rest } = r;
  return rest as Omit<T, 'userId'>;
};

export function createFileStore(dir: string): Store {
  const file = path.join(dir, 'db.json');
  let data: Data = empty();
  let writing: Promise<void> = Promise.resolve();

  const persist = () => {
    writing = writing.then(async () => {
      const tmp = `${file}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(data, null, 2));
      await fs.rename(tmp, file);
    });
    return writing;
  };

  const now = () => Date.now();

  return {
    async init() {
      await fs.mkdir(dir, { recursive: true });
      try {
        data = { ...empty(), ...JSON.parse(await fs.readFile(file, 'utf8')) };
      } catch {
        data = empty();
        await persist();
      }
      // Housekeeping: drop expired sessions.
      data.sessions = data.sessions.filter((s) => Date.parse(s.expiresAt) > now());
    },
    async close() {
      await writing;
    },

    users: {
      async findById(id) {
        return data.users.find((u) => u.id === id) ?? null;
      },
      async findByEmail(email) {
        return data.users.find((u) => u.email === email.toLowerCase()) ?? null;
      },
      async findByGoogleId(googleId) {
        return data.users.find((u) => u.googleId === googleId) ?? null;
      },
      async create(u) {
        data.users.push(u);
        await persist();
        return u;
      },
      async update(id, patch) {
        const u = data.users.find((x) => x.id === id);
        if (!u) return null;
        Object.assign(u, patch, { updatedAt: new Date().toISOString() });
        await persist();
        return u;
      },
    },

    sessions: {
      async create(s) {
        data.sessions.push(s);
        await persist();
      },
      async find(tokenHash) {
        const s = data.sessions.find((x) => x.tokenHash === tokenHash);
        return s && Date.parse(s.expiresAt) > now() ? s : null;
      },
      async delete(tokenHash) {
        data.sessions = data.sessions.filter((s) => s.tokenHash !== tokenHash);
        await persist();
      },
      async deleteForUser(userId, except) {
        data.sessions = data.sessions.filter((s) => s.userId !== userId || s.tokenHash === except);
        await persist();
      },
    },

    resets: {
      async create(r) {
        data.resets.push(r);
        await persist();
      },
      async find(tokenHash) {
        return data.resets.find((r) => r.tokenHash === tokenHash) ?? null;
      },
      async markUsed(tokenHash) {
        const r = data.resets.find((x) => x.tokenHash === tokenHash);
        if (r) r.usedAt = new Date().toISOString();
        await persist();
      },
    },

    addresses: {
      async list(userId) {
        return data.addresses.filter((a) => a.userId === userId).map(strip);
      },
      async create(userId, a) {
        data.addresses.push({ ...a, userId });
        await persist();
        return a;
      },
      async update(userId, id, input) {
        const a = data.addresses.find((x) => x.id === id && x.userId === userId);
        if (!a) return null;
        Object.assign(a, input);
        await persist();
        return strip(a);
      },
      async delete(userId, id) {
        const before = data.addresses.length;
        data.addresses = data.addresses.filter((a) => !(a.id === id && a.userId === userId));
        await persist();
        return data.addresses.length < before;
      },
    },

    quotes: {
      async list(userId) {
        return data.quotes.filter((q) => q.userId === userId).map(strip).reverse();
      },
      async create(userId, q) {
        data.quotes.push({ ...q, userId });
        await persist();
        return q;
      },
      async delete(userId, id) {
        const before = data.quotes.length;
        data.quotes = data.quotes.filter((q) => !(q.id === id && q.userId === userId));
        await persist();
        return data.quotes.length < before;
      },
    },

    shipments: {
      async create(s) {
        data.shipments.push(s);
        await persist();
        return s;
      },
      async findById(id) {
        return data.shipments.find((s) => s.id === id) ?? null;
      },
      async findByTrackingId(trackingId) {
        return data.shipments.find((s) => s.trackingId === trackingId) ?? null;
      },
      async listByUser(userId) {
        return data.shipments.filter((s) => s.userId === userId).reverse();
      },
      async update(id, patch) {
        const s = data.shipments.find((x) => x.id === id);
        if (!s) return null;
        Object.assign(s, patch);
        await persist();
        return s;
      },
      async nextTrackingSequence() {
        data.trackingSeq += 1;
        await persist();
        return data.trackingSeq;
      },
    },

    payments: {
      async create(p) {
        data.payments.push(p);
        await persist();
        return p;
      },
      async findByOrderId(orderId) {
        return data.payments.find((p) => p.orderId === orderId) ?? null;
      },
      async update(id, patch) {
        const p = data.payments.find((x) => x.id === id);
        if (!p) return null;
        Object.assign(p, patch);
        await persist();
        return p;
      },
    },

    contact: {
      async create(m) {
        data.contact.push(m);
        await persist();
        return m;
      },
    },
  };
}
