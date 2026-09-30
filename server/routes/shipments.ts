import crypto from 'node:crypto';
import { Router } from 'express';
import { db } from '../db';
import type { ShipmentRecord } from '../db/types';
import { requireAuth } from '../auth/auth';
import { HttpError, PHONE_RE, newId, route, str } from '../lib/http';
import { addBusinessDays, atHour } from '../lib/dates';
import { paymentProvider } from '../payments';
import { demoTracking } from '../demoShipments';
import { calculateQuote, QuoteError } from '../../src/lib/pricing';
import { findCity } from '../../src/data/cities';
import { getState, PINCODE_PATTERN } from '../../src/data/indiaStates';
import { CARGO_TYPES, DELIVERY_SPEEDS, TRANSPORT_MODES, type CargoType, type DeliverySpeed, type TransportMode } from '../../src/config/pricing';
import type { PartyDetails, PaymentReceipt, Shipment, TrackingResult } from '../../src/lib/apiTypes';

export const shipmentsRouter = Router();

const publicShipment = (s: ShipmentRecord): Shipment => {
  const { userId: _u, ...rest } = s;
  return rest;
};

function parseParty(raw: unknown, prefix: string, fields: Record<string, string>): PartyDetails {
  const r = (raw ?? {}) as Record<string, unknown>;
  const p: PartyDetails = {
    name: str(r.name, 120),
    phone: str(r.phone, 20),
    address: str(r.address, 300),
    city: str(r.city, 80),
    state: str(r.state, 80),
    pincode: str(r.pincode, 6),
  };
  if (p.name.length < 2) fields[`${prefix}.name`] = 'Enter a name.';
  if (!PHONE_RE.test(p.phone)) fields[`${prefix}.phone`] = 'Enter a valid phone number.';
  if (p.address.length < 5) fields[`${prefix}.address`] = 'Enter the full address.';
  if (p.city.length < 2) fields[`${prefix}.city`] = 'Enter the city.';
  if (!getState(p.state)) fields[`${prefix}.state`] = 'Choose a state.';
  if (!PINCODE_PATTERN.test(p.pincode)) fields[`${prefix}.pincode`] = 'Enter a valid 6-digit pincode.';
  return p;
}

/** Create a booking (awaiting payment). The price is always computed here. */
shipmentsRouter.post(
  '/shipments',
  requireAuth,
  route(async (req, res) => {
    const fields: Record<string, string> = {};
    const sender = parseParty(req.body.sender, 'sender', fields);
    const receiver = parseParty(req.body.receiver, 'receiver', fields);
    const mode = req.body.mode as TransportMode;
    const cargoType = req.body.cargoType as CargoType;
    const speed = req.body.speed as DeliverySpeed;
    const weightKg = Number(req.body.weightKg);
    if (!(mode in TRANSPORT_MODES)) fields.mode = 'Choose a transport mode.';
    if (!(cargoType in CARGO_TYPES)) fields.cargoType = 'Choose a cargo type.';
    if (!(speed in DELIVERY_SPEEDS)) fields.speed = 'Choose a delivery speed.';
    if (Object.keys(fields).length) throw new HttpError(400, 'Please check the highlighted fields.', fields);

    let breakdown;
    try {
      breakdown = calculateQuote({
        mode,
        cargoType,
        speed,
        weightKg,
        pickupState: sender.state,
        destinationState: receiver.state,
        pickupCoords: findCity(sender.city, sender.state)?.coords,
        destinationCoords: findCity(receiver.city, receiver.state)?.coords,
      });
    } catch (e) {
      if (e instanceof QuoteError) throw new HttpError(400, e.message, { weightKg: e.message });
      throw e;
    }

    const shipment = await db().shipments.create({
      id: newId(),
      userId: req.user!.id,
      bookingId: `BK-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      trackingId: null,
      status: 'PENDING_PAYMENT',
      mode,
      speed,
      cargoType,
      weightKg,
      sender,
      receiver,
      price: breakdown.total,
      breakdown,
      estimatedDelivery: null,
      events: [],
      createdAt: new Date().toISOString(),
      paidAt: null,
    });
    res.status(201).json({ shipment: publicShipment(shipment) });
  }),
);

shipmentsRouter.get(
  '/shipments',
  requireAuth,
  route(async (req, res) => {
    const list = await db().shipments.listByUser(req.user!.id);
    res.json({ shipments: list.map(publicShipment) });
  }),
);

async function ownShipment(userId: string, id: string) {
  const s = await db().shipments.findById(id);
  if (!s || s.userId !== userId) throw new HttpError(404, 'Shipment not found.');
  return s;
}

shipmentsRouter.get(
  '/shipments/:id',
  requireAuth,
  route(async (req, res) => {
    res.json({ shipment: publicShipment(await ownShipment(req.user!.id, String(req.params.id))) });
  }),
);

/* -------------------------------- Payments -------------------------------- */

shipmentsRouter.get('/payments/config', (_req, res) => {
  res.json({ provider: paymentProvider().name });
});

shipmentsRouter.post(
  '/payments/order',
  requireAuth,
  route(async (req, res) => {
    const s = await ownShipment(req.user!.id, str(req.body.shipmentId, 64));
    if (s.status !== 'PENDING_PAYMENT') throw new HttpError(409, 'This booking has already been paid.');
    const provider = paymentProvider();
    const order = await provider.createOrder(s.price, s.bookingId);
    await db().payments.create({
      id: newId(),
      shipmentId: s.id,
      userId: s.userId,
      provider: provider.name,
      orderId: order.orderId,
      amount: s.price,
      status: 'CREATED',
      method: null,
      providerPaymentId: null,
      createdAt: new Date().toISOString(),
      paidAt: null,
    });
    res.json({ provider: provider.name, orderId: order.orderId, amount: s.price, currency: 'INR', clientData: order.clientData });
  }),
);

shipmentsRouter.post(
  '/payments/confirm',
  requireAuth,
  route(async (req, res) => {
    const payment = await db().payments.findByOrderId(str(req.body.orderId, 80));
    if (!payment || payment.userId !== req.user!.id) throw new HttpError(404, 'Payment order not found.');
    if (payment.status === 'PAID') throw new HttpError(409, 'This payment has already been completed.');
    const shipment = await ownShipment(req.user!.id, payment.shipmentId);

    const provider = paymentProvider();
    if (provider.name !== payment.provider) throw new HttpError(409, 'Payment provider changed. Please start the payment again.');
    const result = await provider.verify(payment.orderId, req.body ?? {});
    if (!result.ok) {
      await db().payments.update(payment.id, { status: 'FAILED', method: result.method });
      throw new HttpError(402, result.error ?? 'Payment failed.');
    }

    const now = new Date();
    const seq = await db().shipments.nextTrackingSequence();
    const trackingId = `YA2-${now.getFullYear()}-${String(seq).padStart(6, '0')}`;
    const pickupDay = atHour(addBusinessDays(now, 1), 10);
    const eta = atHour(addBusinessDays(pickupDay, shipment.breakdown.transitDays[1]), 18);
    const from = `${shipment.sender.city}, ${shipment.sender.state}`;

    const updated = await db().shipments.update(shipment.id, {
      trackingId,
      status: 'PICKUP_SCHEDULED',
      paidAt: now.toISOString(),
      estimatedDelivery: eta.toISOString(),
      events: [
        { stage: 'ORDER_CONFIRMED', at: now.toISOString(), location: from, note: `Booking ${shipment.bookingId} confirmed` },
        {
          stage: 'PICKUP_SCHEDULED',
          at: new Date(now.getTime() + 60_000).toISOString(),
          location: from,
          note: `Pickup planned for ${pickupDay.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, 10 AM – 6 PM`,
        },
      ],
    });
    await db().payments.update(payment.id, {
      status: 'PAID',
      method: result.method,
      providerPaymentId: result.providerPaymentId ?? null,
      paidAt: now.toISOString(),
    });

    const receipt: PaymentReceipt = {
      paymentId: result.providerPaymentId ?? payment.id,
      provider: payment.provider,
      method: result.method,
      amount: payment.amount,
      paidAt: now.toISOString(),
      isDemo: payment.provider === 'demo',
      shipment: publicShipment(updated!),
    };
    res.json({ receipt });
  }),
);

/* -------------------------------- Tracking -------------------------------- */

shipmentsRouter.get(
  '/track/:trackingId',
  route(async (req, res) => {
    const id = String(req.params.trackingId).trim().toUpperCase();
    if (!/^YA2-\d{4}-\d{6}$/.test(id)) throw new HttpError(400, 'Tracking IDs look like YA2-2026-001284.');
    const demo = demoTracking(id);
    if (demo) return res.json({ tracking: demo });
    const s = await db().shipments.findByTrackingId(id);
    if (!s || s.status === 'PENDING_PAYMENT') throw new HttpError(404, 'We could not find a shipment with this tracking ID.');
    const last = s.events[s.events.length - 1];
    const tracking: TrackingResult = {
      trackingId: id,
      status: s.status,
      mode: s.mode,
      weightKg: s.weightKg,
      pickup: `${s.sender.city}, ${s.sender.state}`,
      destination: `${s.receiver.city}, ${s.receiver.state}`,
      currentLocation: last?.location ?? `${s.sender.city}, ${s.sender.state}`,
      estimatedDelivery: s.estimatedDelivery,
      events: s.events,
      isDemo: false,
    };
    res.json({ tracking });
  }),
);
