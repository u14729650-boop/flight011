/**
 * Payment gateway abstraction. The checkout flow only talks to a
 * PaymentProvider, so switching from the demo provider to Razorpay or Stripe
 * is a configuration change (PAYMENT_PROVIDER=razorpay + keys).
 */
import crypto from 'node:crypto';
import { ENV } from '../env';
import { HttpError } from '../lib/http';
import { PAYMENT_METHODS, type PaymentMethod } from '../../src/lib/apiTypes';

export interface CreateOrderResult {
  orderId: string;
  clientData: Record<string, unknown>;
}

export interface VerifyResult {
  ok: boolean;
  providerPaymentId?: string;
  method: PaymentMethod;
  error?: string;
}

export interface PaymentProvider {
  name: 'demo' | 'razorpay' | 'stripe';
  createOrder(amountInRupees: number, receipt: string): Promise<CreateOrderResult>;
  /** Verifies the payment result the browser sends back after checkout. */
  verify(orderId: string, body: Record<string, unknown>): Promise<VerifyResult>;
}

const isMethod = (m: unknown): m is PaymentMethod => typeof m === 'string' && m in PAYMENT_METHODS;

/**
 * DEMO PAYMENT MODE — no money moves. Details typed in the demo form are
 * validated for shape in the browser and never sent to the server except the
 * chosen method. Use UPI ID "fail@demo" or card 4000 0000 0000 0002 in the
 * browser to see a declined payment.
 */
const demoProvider: PaymentProvider = {
  name: 'demo',
  async createOrder() {
    return { orderId: `demo_order_${crypto.randomBytes(8).toString('hex')}`, clientData: { mode: 'demo' } };
  },
  async verify(_orderId, body) {
    if (!isMethod(body.method)) return { ok: false, method: 'UPI', error: 'Choose a payment method.' };
    if (body.simulateFailure === true) return { ok: false, method: body.method, error: 'The demo payment was declined (test failure scenario).' };
    if (body.demoConfirm !== true) return { ok: false, method: body.method, error: 'Demo payment was not confirmed.' };
    return { ok: true, method: body.method, providerPaymentId: `demo_pay_${crypto.randomBytes(8).toString('hex')}` };
  },
};

/** Razorpay Orders API + checkout signature verification. */
const razorpayProvider: PaymentProvider = {
  name: 'razorpay',
  async createOrder(amount, receipt) {
    const auth = Buffer.from(`${ENV.razorpay.keyId}:${ENV.razorpay.keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt }),
    });
    if (!res.ok) throw new HttpError(502, 'Could not start the payment. Please try again.');
    const order = (await res.json()) as { id: string };
    return { orderId: order.id, clientData: { keyId: ENV.razorpay.keyId } };
  },
  async verify(orderId, body) {
    const paymentId = String(body.razorpay_payment_id ?? '');
    const signature = String(body.razorpay_signature ?? '');
    const expected = crypto.createHmac('sha256', ENV.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    const ok = signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    return { ok, providerPaymentId: paymentId, method: isMethod(body.method) ? body.method : 'UPI', error: ok ? undefined : 'Payment verification failed.' };
  },
};

/** Stripe placeholder — implement with PaymentIntents when Stripe is chosen. */
const stripeProvider: PaymentProvider = {
  name: 'stripe',
  async createOrder() {
    throw new HttpError(501, 'Stripe payments are not set up yet.');
  },
  async verify() {
    throw new HttpError(501, 'Stripe payments are not set up yet.');
  },
};

export function paymentProvider(): PaymentProvider {
  if (ENV.paymentProvider === 'razorpay' && ENV.razorpay.keyId && ENV.razorpay.keySecret) return razorpayProvider;
  if (ENV.paymentProvider === 'stripe' && ENV.stripe.secretKey) return stripeProvider;
  return demoProvider;
}
