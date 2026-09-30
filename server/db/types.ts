/**
 * Storage contract. Every backend (JSON file today, Oracle Database next)
 * implements this interface; routes only ever talk to `Store`.
 */
import type { Address, AddressInput, SavedQuote, Shipment } from '../../src/lib/apiTypes';

export interface UserRecord {
  id: string;
  name: string;
  email: string; // stored lower-case
  phone: string | null;
  passwordHash: string | null; // null for Google-only accounts
  googleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface ResetRecord {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface ShipmentRecord extends Shipment {
  userId: string;
}

export interface PaymentRecord {
  id: string;
  shipmentId: string;
  userId: string;
  provider: 'demo' | 'razorpay' | 'stripe';
  orderId: string;
  amount: number;
  status: 'CREATED' | 'PAID' | 'FAILED';
  method: string | null;
  providerPaymentId: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface ContactRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface Store {
  init(): Promise<void>;
  close(): Promise<void>;

  users: {
    findById(id: string): Promise<UserRecord | null>;
    findByEmail(email: string): Promise<UserRecord | null>;
    findByGoogleId(googleId: string): Promise<UserRecord | null>;
    create(u: UserRecord): Promise<UserRecord>;
    update(id: string, patch: Partial<Omit<UserRecord, 'id' | 'createdAt'>>): Promise<UserRecord | null>;
  };

  sessions: {
    create(s: SessionRecord): Promise<void>;
    find(tokenHash: string): Promise<SessionRecord | null>;
    delete(tokenHash: string): Promise<void>;
    deleteForUser(userId: string, exceptTokenHash?: string): Promise<void>;
  };

  resets: {
    create(r: ResetRecord): Promise<void>;
    find(tokenHash: string): Promise<ResetRecord | null>;
    markUsed(tokenHash: string): Promise<void>;
  };

  addresses: {
    list(userId: string): Promise<Address[]>;
    create(userId: string, a: Address): Promise<Address>;
    update(userId: string, id: string, a: AddressInput): Promise<Address | null>;
    delete(userId: string, id: string): Promise<boolean>;
  };

  quotes: {
    list(userId: string): Promise<SavedQuote[]>;
    create(userId: string, q: SavedQuote): Promise<SavedQuote>;
    delete(userId: string, id: string): Promise<boolean>;
  };

  shipments: {
    create(s: ShipmentRecord): Promise<ShipmentRecord>;
    findById(id: string): Promise<ShipmentRecord | null>;
    findByTrackingId(trackingId: string): Promise<ShipmentRecord | null>;
    listByUser(userId: string): Promise<ShipmentRecord[]>;
    update(id: string, patch: Partial<ShipmentRecord>): Promise<ShipmentRecord | null>;
    /** Next value of the tracking number sequence. */
    nextTrackingSequence(): Promise<number>;
  };

  payments: {
    create(p: PaymentRecord): Promise<PaymentRecord>;
    findByOrderId(orderId: string): Promise<PaymentRecord | null>;
    update(id: string, patch: Partial<PaymentRecord>): Promise<PaymentRecord | null>;
  };

  contact: {
    create(m: ContactRecord): Promise<ContactRecord>;
  };
}
