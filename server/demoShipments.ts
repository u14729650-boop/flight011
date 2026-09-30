/**
 * Demo tracking data so the Track Shipment page can be tested without
 * booking anything. Timelines are generated relative to today so they always
 * look current. Real shipments come from the database.
 */
import { SHIPMENT_STAGES, type ShipmentEvent, type ShipmentStage, type TrackingResult } from '../src/lib/apiTypes';
import type { TransportMode } from '../src/config/pricing';
import { addBusinessDays, atHour } from './lib/dates';

interface DemoDef {
  trackingId: string;
  mode: TransportMode;
  weightKg: number;
  pickup: string;
  destination: string;
  reached: ShipmentStage;
  /** Location + day offset (relative to today, negative = past) + hour per stage. */
  steps: Partial<Record<ShipmentStage, { location: string; day: number; hour: number; note?: string }>>;
  etaDay: number;
}

const DEMOS: DemoDef[] = [
  {
    trackingId: 'YA2-2026-001284',
    mode: 'ROAD',
    weightKg: 240,
    pickup: 'Ahmedabad, Gujarat',
    destination: 'New Delhi, Delhi',
    reached: 'IN_TRANSIT',
    steps: {
      ORDER_CONFIRMED: { location: 'Ahmedabad, Gujarat', day: -3, hour: 10 },
      PICKUP_SCHEDULED: { location: 'Ahmedabad, Gujarat', day: -3, hour: 11, note: 'Pickup slot 2 PM – 5 PM' },
      PICKED_UP: { location: 'Naroda, Ahmedabad', day: -2, hour: 15 },
      IN_TRANSIT: { location: 'Udaipur, Rajasthan (NH 48)', day: 0, hour: 8, note: 'Line haul on NH 48 towards Jaipur hub' },
    },
    etaDay: 2,
  },
  {
    trackingId: 'YA2-2026-001285',
    mode: 'AIR',
    weightKg: 18,
    pickup: 'Mumbai, Maharashtra',
    destination: 'Bengaluru, Karnataka',
    reached: 'DELIVERED',
    steps: {
      ORDER_CONFIRMED: { location: 'Mumbai, Maharashtra', day: -3, hour: 9 },
      PICKUP_SCHEDULED: { location: 'Andheri East, Mumbai', day: -3, hour: 9 },
      PICKED_UP: { location: 'Andheri East, Mumbai', day: -3, hour: 13 },
      IN_TRANSIT: { location: 'Mumbai Air Cargo Complex', day: -3, hour: 19, note: 'Departed on evening domestic flight' },
      REACHED_HUB: { location: 'Bengaluru Air Cargo Terminal', day: -2, hour: 1 },
      OUT_FOR_DELIVERY: { location: 'Whitefield, Bengaluru', day: -2, hour: 9 },
      DELIVERED: { location: 'Whitefield, Bengaluru', day: -2, hour: 12, note: 'Received by: Front desk' },
    },
    etaDay: -2,
  },
  {
    trackingId: 'YA2-2026-001290',
    mode: 'MOVERS',
    weightKg: 1850,
    pickup: 'Pune, Maharashtra',
    destination: 'Hyderabad, Telangana',
    reached: 'OUT_FOR_DELIVERY',
    steps: {
      ORDER_CONFIRMED: { location: 'Pune, Maharashtra', day: -5, hour: 11 },
      PICKUP_SCHEDULED: { location: 'Baner, Pune', day: -5, hour: 12, note: 'Packing crew of 4 assigned' },
      PICKED_UP: { location: 'Baner, Pune', day: -4, hour: 17, note: '64 items packed and loaded' },
      IN_TRANSIT: { location: 'Solapur, Maharashtra (NH 65)', day: -3, hour: 10 },
      REACHED_HUB: { location: 'Hyderabad hub, Telangana', day: -1, hour: 18 },
      OUT_FOR_DELIVERY: { location: 'Gachibowli, Hyderabad', day: 0, hour: 9, note: 'Unloading & unpacking crew on the way' },
    },
    etaDay: 0,
  },
  {
    trackingId: 'YA2-2026-001301',
    mode: 'AIR',
    weightKg: 100,
    pickup: 'Kolkata, West Bengal',
    destination: 'Chennai, Tamil Nadu',
    reached: 'PICKUP_SCHEDULED',
    steps: {
      ORDER_CONFIRMED: { location: 'Kolkata, West Bengal', day: 0, hour: 9 },
      PICKUP_SCHEDULED: { location: 'Salt Lake, Kolkata', day: 0, hour: 10, note: 'Pickup slot 3 PM – 6 PM today' },
    },
    etaDay: 2,
  },
];

export const DEMO_TRACKING_IDS = DEMOS.map((d) => d.trackingId);

function dayOffset(base: Date, offset: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d;
}

export function demoTracking(trackingId: string): TrackingResult | null {
  const def = DEMOS.find((d) => d.trackingId === trackingId);
  if (!def) return null;
  const today = new Date();
  const events: ShipmentEvent[] = [];
  for (const stage of SHIPMENT_STAGES) {
    const s = def.steps[stage];
    if (!s) continue;
    events.push({ stage, at: atHour(dayOffset(today, s.day), s.hour).toISOString(), location: s.location, note: s.note });
  }
  const last = events[events.length - 1];
  return {
    trackingId: def.trackingId,
    status: def.reached,
    mode: def.mode,
    weightKg: def.weightKg,
    pickup: def.pickup,
    destination: def.destination,
    currentLocation: last.location,
    estimatedDelivery: (def.etaDay > 0 ? addBusinessDays(today, def.etaDay) : dayOffset(today, def.etaDay)).toISOString(),
    events,
    isDemo: true,
  };
}
