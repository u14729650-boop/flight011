import { Router } from 'express';
import { db } from '../db';
import { currentTokenHash, hashPassword, passwordProblem, requireAuth, toPublicUser, verifyPassword } from '../auth/auth';
import { EMAIL_RE, HttpError, PHONE_RE, newId, rateLimit, route, str } from '../lib/http';
import { calculateQuote, QuoteError } from '../../src/lib/pricing';
import { findCity } from '../../src/data/cities';
import { getState, PINCODE_PATTERN } from '../../src/data/indiaStates';
import type { AddressInput } from '../../src/lib/apiTypes';

export const accountRouter = Router();

/* --------------------------------- Profile -------------------------------- */

accountRouter.patch(
  '/account/profile',
  requireAuth,
  route(async (req, res) => {
    const name = str(req.body.name, 120);
    const phone = str(req.body.phone, 20);
    const fields: Record<string, string> = {};
    if (name.length < 2) fields.name = 'Enter your full name.';
    if (phone && !PHONE_RE.test(phone)) fields.phone = 'Enter a valid phone number.';
    if (Object.keys(fields).length) throw new HttpError(400, 'Please check the highlighted fields.', fields);
    const user = await db().users.update(req.user!.id, { name, phone: phone || null });
    res.json({ user: toPublicUser(user!) });
  }),
);

accountRouter.post(
  '/account/password',
  requireAuth,
  rateLimit('password', 8, 60_000),
  route(async (req, res) => {
    const current = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const next = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    const user = req.user!;
    if (user.passwordHash && !(await verifyPassword(current, user.passwordHash))) {
      throw new HttpError(400, 'Your current password is incorrect.', { currentPassword: 'Incorrect password.' });
    }
    const err = passwordProblem(next);
    if (err) throw new HttpError(400, err, { newPassword: err });
    await db().users.update(user.id, { passwordHash: await hashPassword(next) });
    await db().sessions.deleteForUser(user.id, currentTokenHash(req));
    res.json({ ok: true });
  }),
);

/* -------------------------------- Addresses ------------------------------- */

function parseAddress(body: Record<string, unknown>): AddressInput {
  const a: AddressInput = {
    label: str(body.label, 40) || 'Address',
    name: str(body.name, 120),
    phone: str(body.phone, 20),
    line1: str(body.line1, 300),
    city: str(body.city, 80),
    state: str(body.state, 80),
    pincode: str(body.pincode, 6),
  };
  const fields: Record<string, string> = {};
  if (a.name.length < 2) fields.name = 'Enter a contact name.';
  if (!PHONE_RE.test(a.phone)) fields.phone = 'Enter a valid phone number.';
  if (a.line1.length < 5) fields.line1 = 'Enter the full address.';
  if (a.city.length < 2) fields.city = 'Enter the city.';
  if (!getState(a.state)) fields.state = 'Choose a state.';
  if (!PINCODE_PATTERN.test(a.pincode)) fields.pincode = 'Enter a valid 6-digit pincode.';
  if (Object.keys(fields).length) throw new HttpError(400, 'Please check the highlighted fields.', fields);
  return a;
}

accountRouter.get(
  '/addresses',
  requireAuth,
  route(async (req, res) => res.json({ addresses: await db().addresses.list(req.user!.id) })),
);

accountRouter.post(
  '/addresses',
  requireAuth,
  route(async (req, res) => {
    const input = parseAddress(req.body ?? {});
    const address = await db().addresses.create(req.user!.id, { ...input, id: newId(), createdAt: new Date().toISOString() });
    res.status(201).json({ address });
  }),
);

accountRouter.put(
  '/addresses/:id',
  requireAuth,
  route(async (req, res) => {
    const address = await db().addresses.update(req.user!.id, String(req.params.id), parseAddress(req.body ?? {}));
    if (!address) throw new HttpError(404, 'Address not found.');
    res.json({ address });
  }),
);

accountRouter.delete(
  '/addresses/:id',
  requireAuth,
  route(async (req, res) => {
    if (!(await db().addresses.delete(req.user!.id, String(req.params.id)))) throw new HttpError(404, 'Address not found.');
    res.json({ ok: true });
  }),
);

/* --------------------------------- Quotes --------------------------------- */

accountRouter.get(
  '/quotes',
  requireAuth,
  route(async (req, res) => res.json({ quotes: await db().quotes.list(req.user!.id) })),
);

accountRouter.post(
  '/quotes',
  requireAuth,
  route(async (req, res) => {
    const b = req.body ?? {};
    const pickupCity = str(b.pickupCity, 80) || undefined;
    const destinationCity = str(b.destinationCity, 80) || undefined;
    try {
      const q = calculateQuote({
        mode: b.mode,
        pickupState: str(b.pickupState, 80),
        destinationState: str(b.destinationState, 80),
        weightKg: Number(b.weightKg),
        cargoType: b.cargoType,
        speed: b.speed,
        pickupCoords: pickupCity ? findCity(pickupCity, b.pickupState)?.coords : undefined,
        destinationCoords: destinationCity ? findCity(destinationCity, b.destinationState)?.coords : undefined,
      });
      const quote = await db().quotes.create(req.user!.id, {
        id: newId(),
        mode: q.input.mode,
        pickupState: q.input.pickupState,
        destinationState: q.input.destinationState,
        pickupCity,
        destinationCity,
        weightKg: q.input.weightKg,
        cargoType: q.input.cargoType,
        speed: q.input.speed,
        total: q.total,
        transitLabel: q.transitLabel,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json({ quote });
    } catch (e) {
      if (e instanceof QuoteError) throw new HttpError(400, e.message);
      throw e;
    }
  }),
);

accountRouter.delete(
  '/quotes/:id',
  requireAuth,
  route(async (req, res) => {
    if (!(await db().quotes.delete(req.user!.id, String(req.params.id)))) throw new HttpError(404, 'Quote not found.');
    res.json({ ok: true });
  }),
);

/* --------------------------------- Contact -------------------------------- */

accountRouter.post(
  '/contact',
  rateLimit('contact', 5, 60_000),
  route(async (req, res) => {
    const m = {
      name: str(req.body.name, 120),
      email: str(req.body.email, 254),
      phone: str(req.body.phone, 20),
      subject: str(req.body.subject, 200),
      message: str(req.body.message, 4000),
    };
    const fields: Record<string, string> = {};
    if (m.name.length < 2) fields.name = 'Enter your name.';
    if (!EMAIL_RE.test(m.email)) fields.email = 'Enter a valid email address.';
    if (m.phone && !PHONE_RE.test(m.phone)) fields.phone = 'Enter a valid phone number.';
    if (m.subject.length < 3) fields.subject = 'Add a subject.';
    if (m.message.length < 10) fields.message = 'Tell us a little more (at least 10 characters).';
    if (Object.keys(fields).length) throw new HttpError(400, 'Please check the highlighted fields.', fields);
    const saved = await db().contact.create({ ...m, id: newId(), createdAt: new Date().toISOString() });
    res.status(201).json({ ok: true, reference: `MSG-${saved.id.slice(0, 8).toUpperCase()}` });
  }),
);

