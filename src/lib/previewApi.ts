/**
 * In-browser stand-in for the YA² API, used only by the preview build
 * (VITE_PREVIEW=1) where no server is available. Data lives in this
 * browser's localStorage. The real API in /server is used everywhere else.
 */
import { calculateQuote, QuoteError } from './pricing';
import { findCity } from '../data/cities';
import { getState, PINCODE_PATTERN } from '../data/indiaStates';
import { demoTracking } from '../../server/demoShipments';
import { addBusinessDays, atHour } from '../../server/lib/dates';
import { PAYMENT_METHODS, type ActivityItem, type ActivityType, type Address, type PaymentMethod, type PublicUser, type SavedQuote, type Shipment, type TrackingResult } from './apiTypes';
import { describeDevice } from './device';
import { formatINR } from './format';
import { TRANSPORT_MODES } from '../config/pricing';

class PreviewError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) {
    super(message);
  }
}

interface User extends PublicUser {
  hash: string;
}
interface Db {
  users: User[];
  session: string | null;
  shipments: (Shipment & { userId: string })[];
  quotes: (SavedQuote & { userId: string })[];
  addresses: (Address & { userId: string })[];
  orders: Record<string, string>;
  seq: number;
  contact?: { id: string; name: string; email: string; phone: string; subject: string; message: string; created_at: string }[];
  activity?: (ActivityItem & { userId: string })[];
  payments?: { order_id: string; amount: number; method: string; status: string; provider: string; created_at: string; paid_at: string; shipment_id: string }[];
}

const KEY = 'ya2-preview-db';
function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    /* storage unavailable */
  }
  return { users: [], session: null, shipments: [], quotes: [], addresses: [], orders: {}, seq: 1400 };
}
let mem: Db | null = null;
const db = () => (mem ??= load());
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db()));
  } catch {
    /* keep in memory only */
  }
};

const id = () => crypto.randomUUID();

/** Same per-account history the real API records (dashboard → History). */
function log(userId: string, type: ActivityType, title: string, detail: string | null = null, ref: string | null = null) {
  (db().activity ??= []).push({ id: id(), userId, type, title, detail, ref, createdAt: new Date().toISOString() });
}
const device = () => describeDevice(navigator.userAgent);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
async function hash(pw: string, email: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`ya2:${email}:${pw}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const pub = ({ hash: _h, ...u }: User): PublicUser => u;
const me = () => db().users.find((u) => u.id === db().session) ?? null;
const need = () => {
  const u = me();
  if (!u) throw new PreviewError(401, 'Please log in to continue.');
  return u;
};
function pwProblem(pw: string) {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Password must include a letter and a number.';
  return null;
}
const strip = <T extends { userId?: string }>({ userId: _u, ...r }: T) => r;

function party(raw: Record<string, string> | undefined, prefix: string, fields: Record<string, string>) {
  const p = { name: '', phone: '', address: '', city: '', state: '', pincode: '', ...(raw ?? {}) };
  if (p.name.trim().length < 2) fields[`${prefix}.name`] = 'Enter a name.';
  if (!PHONE_RE.test(p.phone)) fields[`${prefix}.phone`] = 'Enter a valid phone number.';
  if (p.address.trim().length < 5) fields[`${prefix}.address`] = 'Enter the full address.';
  if (p.city.trim().length < 2) fields[`${prefix}.city`] = 'Enter the city.';
  if (!getState(p.state)) fields[`${prefix}.state`] = 'Choose a state.';
  if (!PINCODE_PATTERN.test(p.pincode)) fields[`${prefix}.pincode`] = 'Enter a valid 6-digit pincode.';
  return p;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Body = any;

let adminSignedIn = false;

function adminTables(d: Db) {
  const t = (label: string, columns: string[], rows: Record<string, unknown>[]) => ({ label, columns, rows });
  return {
    contact_messages: t('Enquiries', ['created_at', 'name', 'email', 'phone', 'subject', 'message'], [...(d.contact ?? [])].reverse()),
    users: t('Users', ['created_at', 'name', 'email', 'phone', 'id'], d.users.map((u) => ({ created_at: u.createdAt, name: u.name, email: u.email, phone: u.phone, id: u.id })).reverse()),
    shipments: t(
      'Shipments',
      ['created_at', 'booking_id', 'tracking_id', 'status', 'mode', 'weight_kg', 'price', 'sender_name', 'sender_city', 'receiver_name', 'receiver_city'],
      d.shipments
        .map((s) => ({
          created_at: s.createdAt, booking_id: s.bookingId, tracking_id: s.trackingId, status: s.status, mode: s.mode, weight_kg: s.weightKg, price: s.price,
          sender_name: s.sender.name, sender_city: s.sender.city, receiver_name: s.receiver.name, receiver_city: s.receiver.city,
        }))
        .reverse(),
    ),
    payments: t('Payments', ['created_at', 'order_id', 'amount', 'method', 'status', 'provider'], [...(d.payments ?? [])].reverse()),
    quotes: t(
      'Saved quotes',
      ['created_at', 'mode', 'pickup_state', 'destination_state', 'weight_kg', 'total', 'transit_label'],
      d.quotes.map((q) => ({ created_at: q.createdAt, mode: q.mode, pickup_state: q.pickupState, destination_state: q.destinationState, weight_kg: q.weightKg, total: q.total, transit_label: q.transitLabel })).reverse(),
    ),
    addresses: t('Addresses', ['created_at', 'label', 'name', 'phone', 'line1', 'city', 'state', 'pincode'], d.addresses.map((a) => ({ ...a, created_at: a.createdAt })).reverse()),
  } as Record<string, { label: string; columns: string[]; rows: Record<string, unknown>[] }>;
}

async function handle(method: string, url: string, b: Body): Promise<unknown> {
  const d = db();
  const [path] = url.split('?');
  const now = new Date();

  if (path === '/auth/me') return { user: me() && pub(me()!) };
  if (path === '/auth/providers') return { google: false };
  if (path === '/auth/register') {
    const email = String(b.email ?? '').trim().toLowerCase();
    const fields: Record<string, string> = {};
    if (String(b.name ?? '').trim().length < 2) fields.name = 'Enter your full name.';
    if (!EMAIL_RE.test(email)) fields.email = 'Enter a valid email address.';
    if (!PHONE_RE.test(b.phone ?? '')) fields.phone = 'Enter a valid phone number.';
    const pe = pwProblem(b.password ?? '');
    if (pe) fields.password = pe;
    if (Object.keys(fields).length) throw new PreviewError(400, 'Please check the highlighted fields.', fields);
    if (d.users.some((u) => u.email === email)) throw new PreviewError(409, 'An account with this email already exists.', { email: 'An account with this email already exists. Try logging in.' });
    const u: User = { id: id(), name: b.name.trim(), email, phone: b.phone, authProvider: 'password', createdAt: now.toISOString(), hash: await hash(b.password, email) };
    d.users.push(u);
    d.session = u.id;
    log(u.id, 'ACCOUNT', 'Account created', `Signed up with email · ${device()}`);
    return { user: pub(u) };
  }
  if (path === '/auth/login') {
    const email = String(b.email ?? '').trim().toLowerCase();
    const u = d.users.find((x) => x.email === email);
    if (!u || u.hash !== (await hash(b.password ?? '', email))) {
      if (u) {
        log(u.id, 'SECURITY', 'Failed sign-in attempt', `Wrong password · ${device()}`);
        save();
      }
      throw new PreviewError(401, 'Incorrect email or password.');
    }
    d.session = u.id;
    log(u.id, 'SIGN_IN', 'Signed in', `Email and password · ${device()}`);
    return { user: pub(u) };
  }
  if (path === '/auth/logout') {
    if (d.session) log(d.session, 'SIGN_OUT', 'Signed out', device());
    d.session = null;
    return { ok: true };
  }
  if (path === '/auth/forgot-password') {
    const u = d.users.find((x) => x.email === String(b.email ?? '').trim().toLowerCase());
    return { ok: true, devResetUrl: u ? `/reset-password?token=${u.id}` : undefined };
  }
  if (path === '/auth/reset-password') {
    const u = d.users.find((x) => x.id === b.token);
    if (!u) throw new PreviewError(400, 'This reset link is invalid or has expired. Request a new one.');
    const pe = pwProblem(b.password ?? '');
    if (pe) throw new PreviewError(400, pe, { password: pe });
    u.hash = await hash(b.password, u.email);
    d.session = u.id;
    log(u.id, 'SECURITY', 'Password reset', `Reset link used · ${device()}`);
    return { user: pub(u) };
  }
  if (path === '/account/profile') {
    const u = need();
    const name = String(b.name ?? u.name).trim();
    const phone = b.phone || null;
    const changed = [name !== u.name && 'name', phone !== u.phone && 'phone'].filter(Boolean).join(' and ');
    u.name = name;
    u.phone = phone;
    if (changed) log(u.id, 'PROFILE', 'Profile updated', `Changed ${changed}`);
    return { user: pub(u) };
  }
  if (path === '/account/password') {
    const u = need();
    if (u.hash !== (await hash(b.currentPassword ?? '', u.email))) throw new PreviewError(400, 'Your current password is incorrect.', { currentPassword: 'Incorrect password.' });
    const pe = pwProblem(b.newPassword ?? '');
    if (pe) throw new PreviewError(400, pe, { newPassword: pe });
    u.hash = await hash(b.newPassword, u.email);
    log(u.id, 'SECURITY', 'Password changed', device());
    return { ok: true };
  }

  if (path.startsWith('/addresses')) {
    const u = need();
    const aid = path.split('/')[2];
    if (method === 'GET') return { addresses: d.addresses.filter((a) => a.userId === u.id).map(strip) };
    if (method === 'DELETE') {
      const before = d.addresses.find((a) => a.id === aid && a.userId === u.id);
      if (before) log(u.id, 'ADDRESS', `Address removed: ${before.label}`, `${before.city}, ${before.state}`);
      d.addresses = d.addresses.filter((a) => !(a.id === aid && a.userId === u.id));
      return { ok: true };
    }
    const fields: Record<string, string> = {};
    if ((b.name ?? '').trim().length < 2) fields.name = 'Enter a contact name.';
    if (!PHONE_RE.test(b.phone ?? '')) fields.phone = 'Enter a valid phone number.';
    if ((b.line1 ?? '').trim().length < 5) fields.line1 = 'Enter the full address.';
    if ((b.city ?? '').trim().length < 2) fields.city = 'Enter the city.';
    if (!getState(b.state ?? '')) fields.state = 'Choose a state.';
    if (!PINCODE_PATTERN.test(b.pincode ?? '')) fields.pincode = 'Enter a valid 6-digit pincode.';
    if (Object.keys(fields).length) throw new PreviewError(400, 'Please check the highlighted fields.', fields);
    const input = { label: b.label || 'Address', name: b.name, phone: b.phone, line1: b.line1, city: b.city, state: b.state, pincode: b.pincode };
    if (method === 'PUT') {
      const a = d.addresses.find((x) => x.id === aid && x.userId === u.id);
      if (a) {
        Object.assign(a, input);
        log(u.id, 'ADDRESS', `Address updated: ${a.label}`, `${a.line1}, ${a.city}, ${a.state} ${a.pincode}`);
      }
      return { address: a };
    }
    const a = { ...input, id: id(), createdAt: now.toISOString(), userId: u.id };
    d.addresses.push(a);
    log(u.id, 'ADDRESS', `Address saved: ${a.label}`, `${a.line1}, ${a.city}, ${a.state} ${a.pincode}`);
    return { address: strip(a) };
  }

  if (path.startsWith('/quotes')) {
    const u = need();
    if (method === 'GET') return { quotes: d.quotes.filter((q) => q.userId === u.id).map(strip).reverse() };
    if (method === 'DELETE') {
      const before = d.quotes.find((q) => q.id === path.split('/')[2] && q.userId === u.id);
      if (before) log(u.id, 'QUOTE', 'Quote removed', `${formatINR(before.total)} · ${before.pickupCity ?? before.pickupState} → ${before.destinationCity ?? before.destinationState}`);
      d.quotes = d.quotes.filter((q) => !(q.id === path.split('/')[2] && q.userId === u.id));
      return { ok: true };
    }
    const q = calculateQuote({
      ...b,
      weightKg: Number(b.weightKg),
      pickupCoords: b.pickupCity ? findCity(b.pickupCity, b.pickupState)?.coords : undefined,
      destinationCoords: b.destinationCity ? findCity(b.destinationCity, b.destinationState)?.coords : undefined,
    });
    const saved = { ...b, id: id(), weightKg: Number(b.weightKg), total: q.total, transitLabel: q.transitLabel, createdAt: now.toISOString(), userId: u.id };
    d.quotes.push(saved);
    log(u.id, 'QUOTE', `Quote saved: ${formatINR(q.total)}`, `${TRANSPORT_MODES[q.input.mode].label} · ${b.pickupCity ?? b.pickupState} → ${b.destinationCity ?? b.destinationState} · ${saved.weightKg} kg`);
    return { quote: strip(saved) };
  }

  if (path === '/shipments' && method === 'POST') {
    const u = need();
    const fields: Record<string, string> = {};
    const sender = party(b.sender, 'sender', fields);
    const receiver = party(b.receiver, 'receiver', fields);
    if (Object.keys(fields).length) throw new PreviewError(400, 'Please check the highlighted fields.', fields);
    const breakdown = calculateQuote({
      mode: b.mode,
      cargoType: b.cargoType,
      speed: b.speed,
      weightKg: Number(b.weightKg),
      pickupState: sender.state,
      destinationState: receiver.state,
      pickupCoords: findCity(sender.city, sender.state)?.coords,
      destinationCoords: findCity(receiver.city, receiver.state)?.coords,
    });
    const s = {
      id: id(),
      userId: u.id,
      bookingId: `BK-${now.getFullYear()}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
      trackingId: null,
      status: 'PENDING_PAYMENT' as const,
      mode: b.mode,
      speed: b.speed,
      cargoType: b.cargoType,
      weightKg: Number(b.weightKg),
      sender,
      receiver,
      price: breakdown.total,
      breakdown,
      estimatedDelivery: null,
      events: [],
      createdAt: now.toISOString(),
      paidAt: null,
    };
    d.shipments.push(s);
    log(u.id, 'BOOKING', `Booking created: ${s.bookingId}`, `${TRANSPORT_MODES[s.mode as keyof typeof TRANSPORT_MODES].label} · ${sender.city} → ${receiver.city} · ${s.weightKg} kg · ${formatINR(s.price)} · awaiting payment`, s.bookingId);
    return { shipment: strip(s) };
  }
  if (path === '/activity') {
    const u = need();
    return {
      activity: (d.activity ?? [])
        .filter((a) => a.userId === u.id)
        .map(strip)
        .reverse()
        .slice(0, 300),
    };
  }
  if (path === '/shipments') {
    const u = need();
    return { shipments: d.shipments.filter((s) => s.userId === u.id).map(strip).reverse() };
  }
  if (path.startsWith('/shipments/')) {
    const u = need();
    const s = d.shipments.find((x) => x.id === path.split('/')[2] && x.userId === u.id);
    if (!s) throw new PreviewError(404, 'Shipment not found.');
    return { shipment: strip(s) };
  }

  if (path === '/payments/config') return { provider: 'demo' };
  if (path === '/payments/order') {
    const u = need();
    const s = d.shipments.find((x) => x.id === b.shipmentId && x.userId === u.id);
    if (!s) throw new PreviewError(404, 'Shipment not found.');
    if (s.status !== 'PENDING_PAYMENT') throw new PreviewError(409, 'This booking has already been paid.');
    const orderId = `demo_order_${id().slice(0, 12)}`;
    d.orders[orderId] = s.id;
    return { provider: 'demo', orderId, amount: s.price, currency: 'INR', clientData: { mode: 'demo' } };
  }
  if (path === '/payments/confirm') {
    const u = need();
    const s = d.shipments.find((x) => x.id === d.orders[b.orderId] && x.userId === u.id);
    if (!s) throw new PreviewError(404, 'Payment order not found.');
    const methodLabel = PAYMENT_METHODS[b.method as PaymentMethod] ?? String(b.method);
    if (b.simulateFailure) {
      log(u.id, 'PAYMENT', `Payment failed: ${formatINR(s.price)}`, `${methodLabel} · booking ${s.bookingId}`, s.bookingId);
      save();
      throw new PreviewError(402, 'The demo payment was declined (test failure scenario).');
    }
    d.seq += 1;
    const pickupDay = atHour(addBusinessDays(now, 1), 10);
    const from = `${s.sender.city}, ${s.sender.state}`;
    Object.assign(s, {
      trackingId: `YA2-${now.getFullYear()}-${String(d.seq).padStart(6, '0')}`,
      status: 'PICKUP_SCHEDULED',
      paidAt: now.toISOString(),
      estimatedDelivery: atHour(addBusinessDays(pickupDay, s.breakdown.transitDays[1]), 18).toISOString(),
      events: [
        { stage: 'ORDER_CONFIRMED', at: now.toISOString(), location: from, note: `Booking ${s.bookingId} confirmed` },
        { stage: 'PICKUP_SCHEDULED', at: new Date(now.getTime() + 60_000).toISOString(), location: from, note: 'Pickup planned for the next business day, 10 AM – 6 PM' },
      ],
    });
    log(u.id, 'PAYMENT', `Payment successful: ${formatINR(s.price)}`, `${methodLabel} · booking ${s.bookingId} · tracking ID ${s.trackingId}`, s.trackingId);
    (d.payments ??= []).push({ order_id: b.orderId, amount: s.price, method: b.method, status: 'PAID', provider: 'demo', created_at: now.toISOString(), paid_at: now.toISOString(), shipment_id: s.id });
    return {
      receipt: { paymentId: `demo_pay_${id().slice(0, 12)}`, provider: 'demo', method: b.method, amount: s.price, paidAt: now.toISOString(), isDemo: true, shipment: strip(s) },
    };
  }

  if (path.startsWith('/track/')) {
    const tid = decodeURIComponent(path.split('/')[2]).toUpperCase();
    const demo = demoTracking(tid);
    if (demo) return { tracking: demo };
    const s = d.shipments.find((x) => x.trackingId === tid);
    if (!s) throw new PreviewError(404, 'We could not find a shipment with this tracking ID.');
    const last = s.events[s.events.length - 1];
    const tracking: TrackingResult = {
      trackingId: tid,
      status: s.status,
      mode: s.mode,
      weightKg: s.weightKg,
      pickup: `${s.sender.city}, ${s.sender.state}`,
      destination: `${s.receiver.city}, ${s.receiver.state}`,
      currentLocation: last?.location ?? '',
      estimatedDelivery: s.estimatedDelivery,
      events: s.events,
      isDemo: false,
    };
    return { tracking };
  }
  if (path === '/contact') {
    const m = { id: id(), name: String(b.name ?? ''), email: String(b.email ?? ''), phone: String(b.phone ?? ''), subject: String(b.subject ?? ''), message: String(b.message ?? ''), created_at: now.toISOString() };
    (d.contact ??= []).push(m);
    if (d.session) log(d.session, 'ACCOUNT', `Enquiry sent: ${m.subject}`, null, `MSG-${m.id.slice(0, 8).toUpperCase()}`);
    return { ok: true, reference: `MSG-${m.id.slice(0, 8).toUpperCase()}` };
  }

  // Admin console (preview: data from this browser, password shown on the login screen)
  if (path === '/admin/status') return { enabled: true, signedIn: adminSignedIn, database: 'browser (preview)' };
  if (path === '/admin/login') {
    if (b.password !== 'ya2-demo') throw new PreviewError(401, 'Incorrect admin password.');
    adminSignedIn = true;
    return { ok: true };
  }
  if (path === '/admin/logout') {
    adminSignedIn = false;
    return { ok: true };
  }
  if (path.startsWith('/admin/')) {
    if (!adminSignedIn) throw new PreviewError(401, 'Admin login required.');
    const tables = adminTables(d);
    if (path === '/admin/overview') {
      const byStatus = Object.entries(
        d.shipments.reduce<Record<string, number>>((acc, s) => ((acc[s.status] = (acc[s.status] ?? 0) + 1), acc), {}),
      ).map(([status, n]) => ({ status, n }));
      return {
        counts: Object.fromEntries(Object.entries(tables).map(([k, t]) => [k, t.rows.length])),
        revenue: (d.payments ?? []).reduce((sum, p) => sum + p.amount, 0),
        byStatus,
        tables: Object.fromEntries(Object.entries(tables).map(([k, t]) => [k, t.label])),
      };
    }
    if (path.startsWith('/admin/table/')) {
      const t = tables[path.split('/')[3]];
      if (!t) throw new PreviewError(404, 'Unknown table.');
      return t;
    }
    if (path === '/admin/sql') throw new PreviewError(400, 'The SQL console runs against the SQLite database on the live server. The preview keeps data in your browser instead.');
  }
  throw new PreviewError(404, 'Not found.');
}

export async function previewRequest(method: string, url: string, body: unknown) {
  await new Promise((r) => setTimeout(r, 250));
  try {
    const out = await handle(method, url, body ?? {});
    save();
    return out;
  } catch (e) {
    if (e instanceof PreviewError) throw e;
    if (e instanceof QuoteError) throw new PreviewError(400, e.message, { weightKg: e.message });
    throw new PreviewError(500, 'Something went wrong. Please try again.');
  }
}
export { PreviewError };
