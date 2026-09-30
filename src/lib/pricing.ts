/**
 * Centralised pricing engine — shared by the website and the API.
 *
 * Final estimate = Base price
 *                × distance / state factor
 *                × service (cargo type) factor
 *                × urgency (delivery speed) factor
 */
import {
  AIR_REFERENCE_PRICES,
  CARGO_TYPES,
  DELIVERY_SPEEDS,
  DISTANCE_BANDS,
  MOVERS_RATES,
  ROAD_BASE_RATE_PER_KG,
  ROAD_DISTANCE_FACTOR,
  TRANSIT_DAYS,
  TRANSPORT_MODES,
  WEIGHT_LIMITS,
  type CargoType,
  type DeliverySpeed,
  type DistanceBand,
  type RatePoint,
  type TransportMode,
} from '../config/pricing';
import { getState } from '../data/indiaStates';
import { haversineKm } from './geo';

export interface QuoteInput {
  mode: TransportMode;
  pickupState: string;
  destinationState: string;
  weightKg: number;
  cargoType: CargoType;
  speed: DeliverySpeed;
  /** Optional precise coordinates (e.g. a selected city); fall back to state reference points. */
  pickupCoords?: [number, number];
  destinationCoords?: [number, number];
}

export interface QuoteBreakdown {
  input: QuoteInput;
  basePrice: number;
  distanceKm: number;
  routeKm: number;
  band: DistanceBand;
  bandLabel: string;
  distanceFactor: number;
  distanceAdjustment: number;
  serviceFactor: number;
  serviceAdjustment: number;
  urgencyFactor: number;
  urgencyAdjustment: number;
  total: number;
  transitDays: [number, number];
  transitLabel: string;
}

export class QuoteError extends Error {}

const roundRupees = (n: number) => Math.round(n);

/**
 * Piecewise-linear price from reference points. Below the first point and
 * above the last one, the nearest segment's per-kg rate is used.
 */
export function priceFromReferences(points: RatePoint[], kg: number): number {
  const pts = [...points].sort((a, b) => a.kg - b.kg);
  if (kg <= pts[0].kg) return (pts[0].price / pts[0].kg) * kg;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (kg <= b.kg) return a.price + ((kg - a.kg) * (b.price - a.price)) / (b.kg - a.kg);
  }
  const a = pts[pts.length - 2] ?? { kg: 0, price: 0 };
  const b = pts[pts.length - 1];
  return b.price + ((kg - b.kg) * (b.price - a.price)) / (b.kg - a.kg);
}

export function basePriceFor(mode: TransportMode, kg: number): number {
  switch (mode) {
    case 'AIR':
      return roundRupees(priceFromReferences(AIR_REFERENCE_PRICES, kg));
    case 'ROAD':
      return roundRupees(ROAD_BASE_RATE_PER_KG * kg);
    case 'MOVERS':
      return roundRupees(MOVERS_RATES.crewAndPackingFee + MOVERS_RATES.perKg * kg);
  }
}

export function distanceBand(sameState: boolean, km: number) {
  if (sameState) return DISTANCE_BANDS[0];
  return DISTANCE_BANDS.slice(1).find((b) => km <= b.maxKm) ?? DISTANCE_BANDS[DISTANCE_BANDS.length - 1];
}

export function transitFor(mode: TransportMode, band: DistanceBand, speed: DeliverySpeed): [number, number] {
  const [lo, hi] = TRANSIT_DAYS[mode][band];
  const f = DELIVERY_SPEEDS[speed].dayFactor;
  const min = Math.max(1, Math.ceil(lo * f));
  const max = Math.max(min, Math.ceil(hi * f));
  return [min, max];
}

export function formatTransit([min, max]: [number, number]): string {
  if (min === max) return min === 1 ? '1 Business Day' : `${min} Business Days`;
  return `${min}–${max} Business Days`;
}

export function validateQuoteInput(input: Partial<QuoteInput>): string | null {
  if (!input.mode || !(input.mode in TRANSPORT_MODES)) return 'Choose a transport mode.';
  if (!input.pickupState || !getState(input.pickupState)) return 'Choose a valid pickup state.';
  if (!input.destinationState || !getState(input.destinationState)) return 'Choose a valid destination state.';
  if (!input.cargoType || !(input.cargoType in CARGO_TYPES)) return 'Choose a cargo type.';
  if (!input.speed || !(input.speed in DELIVERY_SPEEDS)) return 'Choose a delivery speed.';
  const w = Number(input.weightKg);
  const lim = WEIGHT_LIMITS[input.mode];
  if (!Number.isFinite(w) || w <= 0) return 'Enter the weight in KG.';
  if (w < lim.min) return `Minimum weight for ${TRANSPORT_MODES[input.mode].label} is ${lim.min} KG.`;
  if (w > lim.max) return `For more than ${lim.max.toLocaleString('en-IN')} KG by ${TRANSPORT_MODES[input.mode].short.toLowerCase()}, please contact us for a custom quote.`;
  return null;
}

export function calculateQuote(input: QuoteInput): QuoteBreakdown {
  const err = validateQuoteInput(input);
  if (err) throw new QuoteError(err);

  const from = getState(input.pickupState)!;
  const to = getState(input.destinationState)!;
  const a = input.pickupCoords ?? from.ref;
  const b = input.destinationCoords ?? to.ref;
  const distanceKm = Math.round(haversineKm(a, b));
  const routeKm = Math.round(input.mode === 'AIR' ? distanceKm : distanceKm * ROAD_DISTANCE_FACTOR);

  const band = distanceBand(from.name === to.name, distanceKm);
  const service = CARGO_TYPES[input.cargoType];
  const speed = DELIVERY_SPEEDS[input.speed];

  const basePrice = basePriceFor(input.mode, input.weightKg);
  const afterDistance = basePrice * band.factor;
  const afterService = afterDistance * service.factor;
  const afterUrgency = afterService * speed.factor;
  const total = roundRupees(afterUrgency);

  const distanceAdjustment = roundRupees(afterDistance - basePrice);
  const serviceAdjustment = roundRupees(afterService - afterDistance);
  // Absorb rounding so the lines always add up to the total.
  const urgencyAdjustment = total - basePrice - distanceAdjustment - serviceAdjustment;

  const transitDays = transitFor(input.mode, band.band, input.speed);

  return {
    input,
    basePrice,
    distanceKm,
    routeKm,
    band: band.band,
    bandLabel: band.label,
    distanceFactor: band.factor,
    distanceAdjustment,
    serviceFactor: service.factor,
    serviceAdjustment,
    urgencyFactor: speed.factor,
    urgencyAdjustment,
    total,
    transitDays,
    transitLabel: formatTransit(transitDays),
  };
}
