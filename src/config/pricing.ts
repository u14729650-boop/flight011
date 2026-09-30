/**
 * YA² pricing configuration — the single source of truth for every price
 * shown on the site and charged at checkout (the API recomputes prices with
 * the same engine, it never trusts a price sent by the browser).
 *
 * All values are INDICATIVE PROTOTYPE RATES chosen by YA². They are not
 * official carrier tariffs. Edit freely.
 */

export type TransportMode = 'AIR' | 'ROAD' | 'MOVERS';
export type CargoType = 'DOCUMENTS' | 'PARCEL' | 'COMMERCIAL' | 'FRAGILE' | 'HEAVY' | 'HOUSEHOLD' | 'OTHER';
export type DeliverySpeed = 'STANDARD' | 'EXPRESS' | 'PRIORITY';
export type DistanceBand = 'SAME_STATE' | 'NEARBY' | 'MEDIUM' | 'LONG' | 'VERY_LONG';

export interface RatePoint {
  kg: number;
  price: number;
}

export const TRANSPORT_MODES: Record<TransportMode, { label: string; short: string }> = {
  AIR: { label: 'Air Transport', short: 'Air' },
  ROAD: { label: 'Road Transport', short: 'Road' },
  MOVERS: { label: 'Movers & Packers', short: 'Movers & Packers' },
};

/** Published reference prices — displayed exactly as listed. */
export const AIR_REFERENCE_PRICES: RatePoint[] = [
  { kg: 10, price: 2500 },
  { kg: 100, price: 25000 },
  { kg: 500, price: 125000 },
];

export const ROAD_BASE_RATE_PER_KG = 100;
export const ROAD_REFERENCE_PRICES: RatePoint[] = [
  { kg: 5, price: 500 },
  { kg: 10, price: 1000 },
  { kg: 15, price: 1500 },
];

/** Movers & Packers: a fixed crew/packing fee plus a per-kg transport rate. */
export const MOVERS_RATES = {
  crewAndPackingFee: 4999,
  perKg: 45,
} as const;

/** Chargeable weight limits per mode (kg). */
export const WEIGHT_LIMITS: Record<TransportMode, { min: number; max: number }> = {
  AIR: { min: 0.5, max: 5000 },
  ROAD: { min: 1, max: 25000 },
  MOVERS: { min: 50, max: 15000 },
};

/**
 * Distance / state multipliers. The band is chosen from the straight-line
 * distance between the pickup and destination reference points.
 * Different states are never cheaper than NEARBY.
 */
export const DISTANCE_BANDS: { band: DistanceBand; label: string; maxKm: number; factor: number }[] = [
  { band: 'SAME_STATE', label: 'Same state', maxKm: 0, factor: 1.0 },
  { band: 'NEARBY', label: 'Nearby state', maxKm: 500, factor: 1.1 },
  { band: 'MEDIUM', label: 'Medium distance', maxKm: 1000, factor: 1.2 },
  { band: 'LONG', label: 'Long distance', maxKm: 1700, factor: 1.35 },
  { band: 'VERY_LONG', label: 'Very long distance', maxKm: Infinity, factor: 1.5 },
];

export const CARGO_TYPES: Record<CargoType, { label: string; factor: number; note: string }> = {
  DOCUMENTS: { label: 'Documents', factor: 0.9, note: 'Light, low-risk handling' },
  PARCEL: { label: 'Parcel', factor: 1.0, note: 'Standard handling' },
  COMMERCIAL: { label: 'Commercial Goods', factor: 1.1, note: 'Invoice & e-way bill handling' },
  FRAGILE: { label: 'Fragile', factor: 1.25, note: 'Extra packing & careful handling' },
  HEAVY: { label: 'Heavy Cargo', factor: 1.3, note: 'Mechanised loading' },
  HOUSEHOLD: { label: 'Household Items', factor: 1.15, note: 'Wrapping & padded loading' },
  OTHER: { label: 'Other', factor: 1.05, note: 'Assessed on pickup' },
};

export const DELIVERY_SPEEDS: Record<DeliverySpeed, { label: string; factor: number; dayFactor: number; note: string }> = {
  STANDARD: { label: 'Standard', factor: 1.0, dayFactor: 1, note: 'Best value' },
  EXPRESS: { label: 'Express', factor: 1.25, dayFactor: 0.75, note: 'Faster dispatch' },
  PRIORITY: { label: 'Priority', factor: 1.5, dayFactor: 0.55, note: 'First available slot' },
};

/** Standard-speed transit time in business days, per mode and distance band. */
export const TRANSIT_DAYS: Record<TransportMode, Record<DistanceBand, [number, number]>> = {
  AIR: { SAME_STATE: [1, 1], NEARBY: [1, 2], MEDIUM: [1, 2], LONG: [2, 3], VERY_LONG: [2, 4] },
  ROAD: { SAME_STATE: [1, 2], NEARBY: [2, 3], MEDIUM: [3, 5], LONG: [5, 7], VERY_LONG: [7, 10] },
  MOVERS: { SAME_STATE: [1, 2], NEARBY: [2, 4], MEDIUM: [4, 6], LONG: [6, 9], VERY_LONG: [8, 12] },
};

/** Road distance is longer than the straight line between two points. */
export const ROAD_DISTANCE_FACTOR = 1.25;

export const PRICING_DISCLAIMER =
  'Final pricing may vary based on pickup location, destination, cargo type, dimensions, urgency and applicable taxes.';
export const ESTIMATE_NOTE = 'Prices are estimates. Final quotation may vary.';
