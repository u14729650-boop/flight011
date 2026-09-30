/** Types shared by the browser and the API. */
import type { CargoType, DeliverySpeed, TransportMode } from '../config/pricing';
import type { QuoteBreakdown } from './pricing';

export const SHIPMENT_STAGES = [
  'ORDER_CONFIRMED',
  'PICKUP_SCHEDULED',
  'PICKED_UP',
  'IN_TRANSIT',
  'REACHED_HUB',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

export type ShipmentStage = (typeof SHIPMENT_STAGES)[number];
export type ShipmentStatus = 'PENDING_PAYMENT' | ShipmentStage | 'CANCELLED';

export const STAGE_LABELS: Record<ShipmentStatus, string> = {
  PENDING_PAYMENT: 'Awaiting Payment',
  ORDER_CONFIRMED: 'Order Confirmed',
  PICKUP_SCHEDULED: 'Pickup Scheduled',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  REACHED_HUB: 'Reached Hub',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  authProvider: 'password' | 'google';
  createdAt: string;
}

export interface AddressInput {
  label: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Address extends AddressInput {
  id: string;
  createdAt: string;
}

export interface PartyDetails {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ShipmentRequest {
  sender: PartyDetails;
  receiver: PartyDetails;
  weightKg: number;
  cargoType: CargoType;
  mode: TransportMode;
  speed: DeliverySpeed;
}

export interface ShipmentEvent {
  stage: ShipmentStage;
  at: string;
  location: string;
  note?: string;
}

export interface Shipment {
  id: string;
  bookingId: string;
  trackingId: string | null;
  status: ShipmentStatus;
  mode: TransportMode;
  speed: DeliverySpeed;
  cargoType: CargoType;
  weightKg: number;
  sender: PartyDetails;
  receiver: PartyDetails;
  price: number;
  breakdown: QuoteBreakdown;
  estimatedDelivery: string | null;
  events: ShipmentEvent[];
  createdAt: string;
  paidAt: string | null;
}

export interface SavedQuote {
  id: string;
  mode: TransportMode;
  pickupState: string;
  destinationState: string;
  pickupCity?: string;
  destinationCity?: string;
  weightKg: number;
  cargoType: CargoType;
  speed: DeliverySpeed;
  total: number;
  transitLabel: string;
  createdAt: string;
}

export interface TrackingResult {
  trackingId: string;
  status: ShipmentStatus;
  mode: TransportMode;
  weightKg: number;
  pickup: string;
  destination: string;
  currentLocation: string;
  estimatedDelivery: string | null;
  events: ShipmentEvent[];
  isDemo: boolean;
}

export type PaymentMethod = 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'WALLET';

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  UPI: 'UPI',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  NET_BANKING: 'Net Banking',
  WALLET: 'Wallet',
};

export interface PaymentOrder {
  provider: 'demo' | 'razorpay' | 'stripe';
  orderId: string;
  amount: number;
  currency: 'INR';
  /** Provider-specific data the checkout UI needs (public keys etc.). */
  clientData: Record<string, unknown>;
}

export interface PaymentReceipt {
  paymentId: string;
  provider: PaymentOrder['provider'];
  method: PaymentMethod;
  amount: number;
  paidAt: string;
  isDemo: boolean;
  shipment: Shipment;
}
