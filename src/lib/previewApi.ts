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
import type { Address, PublicUser, SavedQuote, Shipment, TrackingResult } from './apiTypes';

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
    return { user: pub(u) };
  }
  if (path === '/auth/login') {
    const email = String(b.email ?? '').trim().toLowerCase();
    const u = d.users.find((x) => x.email === email);
    if (!u || u.hash !== (await hash(b.password ?? '', email))) throw new PreviewError(401, 'Incorrect email or password.');
    d.session = u.id;
    return { user: pub(u) };
  }
  if (path === '/auth/logout') {
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
    return { user: pub(u) };
  }
  if (path === '/account/profile') {
    const u = need();
    u.name = String(b.name ?? u.name).trim();
    u.phone = b.phone || null;
    return { user: pub(u) };
  }
  if (path === '/account/password') {
    const u = need();
    if (u.hash !== (await hash(b.currentPassword ?? '', u.email))) throw new PreviewError(400, 'Your current password is incorrect.', { currentPassword: 'Incorrect password.' });
    const pe = pwProblem(b.newPassword ?? '');
    if (pe) throw new PreviewError(400, pe, { newPassword: pe });
    u.hash = await hash(b.newPassword, u.email);
    return { ok: true };
  }

  if (path.startsWith('/addresses')) {
    const u = need();
    const aid = path.split('/')[2];
    if (method === 'GET') return { addresses: d.addresses.filter((a) => a.userId === u.id).map(strip) };
    if (method === 'DELETE') {
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
      if (a) Object.assign(a, input);
      return { address: a };
    }
    const a = { ...input, id: id(), createdAt: now.toISOString(), userId: u.id };
    d.addresses.push(a);
    return { address: strip(a) };
  }

  if (path.startsWith('/quotes')) {
    const u = need();
    if (method === 'GET') return { quotes: d.quotes.filter((q) => q.userId === u.id).map(strip).reverse() };
    if (method === 'DELETE') {
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
    return { shipment: strip(s) };
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
    if (b.simulateFailure) throw new PreviewError(402, 'The demo payment was declined (test failure scenario).');
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
  if (path === '/contact') return { ok: true, reference: `MSG-${id().slice(0, 8).toUpperCase()}` };
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
