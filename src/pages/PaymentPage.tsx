import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LogoMark } from '../components/brand/Logo';
import { PaymentCard, type PaymentSubmit } from '../components/payment/PaymentCard';
import { ButtonLink, Button } from '../components/ui/Button';
import { FormAlert } from '../components/ui/Fields';
import { AlertIcon, CheckCircleIcon, LockIcon, PrinterIcon, ShieldIcon } from '../components/ui/Icons';
import { CARGO_TYPES, DELIVERY_SPEEDS, TRANSPORT_MODES } from '../config/pricing';
import { CONTACT } from '../config/site';
import { api, ApiError } from '../lib/api';
import { PAYMENT_METHODS, type PaymentOrder, type PaymentReceipt, type Shipment } from '../lib/apiTypes';
import { formatDate, formatDateTime, formatINR, formatKg } from '../lib/format';
import { useSeo } from '../lib/seo';

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load the payment window.'));
    document.body.appendChild(s);
  });
}

function OrderSummary({ s }: { s: Shipment }) {
  return (
    <aside className="order card card--pad">
      <h2 className="order__h">Order summary</h2>
      <p className="order__id xs muted">Booking {s.bookingId}</p>
      <dl className="order__kv">
        <div>
          <dt>Transport Mode</dt>
          <dd>{TRANSPORT_MODES[s.mode].label}</dd>
        </div>
        <div>
          <dt>Pickup</dt>
          <dd>
            {s.sender.city}, {s.sender.state} {s.sender.pincode}
          </dd>
        </div>
        <div>
          <dt>Destination</dt>
          <dd>
            {s.receiver.city}, {s.receiver.state} {s.receiver.pincode}
          </dd>
        </div>
        <div>
          <dt>Weight</dt>
          <dd>{formatKg(s.weightKg)}</dd>
        </div>
        <div>
          <dt>Cargo · Speed</dt>
          <dd>
            {CARGO_TYPES[s.cargoType].label} · {DELIVERY_SPEEDS[s.speed].label}
          </dd>
        </div>
        <div>
          <dt>Estimated delivery</dt>
          <dd>{s.breakdown.transitLabel}</dd>
        </div>
      </dl>
      <div className="order__total">
        <span>Estimated Price</span>
        <strong className="tabular">{formatINR(s.price)}</strong>
      </div>
      <p className="xs muted">Taxes as applicable are confirmed on the final invoice.</p>
    </aside>
  );
}

function Receipt({ r }: { r: PaymentReceipt }) {
  const s = r.shipment;
  return (
    <div className="receipt card">
      <div className="receipt__head">
        <CheckCircleIcon className="receipt__check" />
        <h1>Payment Successful</h1>
        {r.isDemo && <span className="badge badge--gold">Demo Payment Mode — no money was charged</span>}
      </div>
      <div className="receipt__ids">
        <div>
          <span>Booking ID</span>
          <strong className="tabular">{s.bookingId}</strong>
        </div>
        <div>
          <span>Tracking ID</span>
          <strong className="tabular">{s.trackingId}</strong>
        </div>
      </div>
      <div className="receipt__print" id="receipt">
        <div className="receipt__brand">
          <LogoMark size={40} />
          <div>
            <strong>
              YA<sup>2</sup> Transport
            </strong>
            <span>{r.isDemo ? 'Demo receipt — not a tax invoice' : 'Payment receipt'}</span>
          </div>
        </div>
        <dl className="order__kv">
          <div>
            <dt>Paid on</dt>
            <dd>{formatDateTime(r.paidAt)}</dd>
          </div>
          <div>
            <dt>Payment ID</dt>
            <dd className="tabular">{r.paymentId}</dd>
          </div>
          <div>
            <dt>Method</dt>
            <dd>{PAYMENT_METHODS[r.method]}</dd>
          </div>
          <div>
            <dt>Service</dt>
            <dd>
              {TRANSPORT_MODES[s.mode].label} · {DELIVERY_SPEEDS[s.speed].label}
            </dd>
          </div>
          <div>
            <dt>Route</dt>
            <dd>
              {s.sender.city}, {s.sender.state} → {s.receiver.city}, {s.receiver.state}
            </dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>{formatKg(s.weightKg)}</dd>
          </div>
          <div>
            <dt>Estimated delivery</dt>
            <dd>{s.estimatedDelivery ? formatDate(s.estimatedDelivery, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : s.breakdown.transitLabel}</dd>
          </div>
        </dl>
        <div className="order__total">
          <span>Amount {r.isDemo ? '(demo)' : 'paid'}</span>
          <strong className="tabular">{formatINR(r.amount)}</strong>
        </div>
        <p className="xs muted">
          Questions? {CONTACT.phoneDisplay} · {CONTACT.emails.join(' · ')}
        </p>
      </div>
      <div className="receipt__actions no-print">
        <Button variant="secondary" icon={<PrinterIcon width={18} />} onClick={() => window.print()}>
          Download / print receipt
        </Button>
        <ButtonLink to={`/track?id=${s.trackingId}`} arrow="right">
          Track shipment
        </ButtonLink>
        <ButtonLink to="/dashboard" variant="ghost" arrow="up-right">
          Go to dashboard
        </ButtonLink>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  useSeo({ title: 'Secure Payment', description: 'Pay for your YA² shipment securely.', noindex: true });
  const [params] = useSearchParams();
  const id = params.get('shipment');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [provider, setProvider] = useState<PaymentOrder['provider']>('demo');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  useEffect(() => {
    if (!id) {
      setLoadError('No booking selected. Start from Book a Shipment.');
      return;
    }
    Promise.all([api.get<{ shipment: Shipment }>(`/shipments/${id}`), api.get<{ provider: PaymentOrder['provider'] }>('/payments/config')])
      .then(([s, c]) => {
        setShipment(s.shipment);
        setProvider(c.provider);
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : 'Could not load this booking.'));
  }, [id]);

  const pay = async ({ method, simulateFailure }: PaymentSubmit) => {
    if (!shipment) return;
    setPaying(true);
    setPayError(null);
    try {
      const order = await api.post<PaymentOrder>('/payments/order', { shipmentId: shipment.id });
      if (order.provider === 'razorpay') {
        await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay!({
            key: order.clientData.keyId,
            amount: order.amount * 100,
            currency: 'INR',
            order_id: order.orderId,
            name: 'YA² Transport',
            description: `Booking ${shipment.bookingId}`,
            handler: async (resp: Record<string, string>) => {
              try {
                const r = await api.post<{ receipt: PaymentReceipt }>('/payments/confirm', { orderId: order.orderId, method, ...resp });
                setReceipt(r.receipt);
                resolve();
              } catch (e) {
                reject(e);
              }
            },
            modal: { ondismiss: () => reject(new ApiError(0, 'Payment was cancelled.')) },
          });
          rzp.open();
        });
      } else {
        const r = await api.post<{ receipt: PaymentReceipt }>('/payments/confirm', {
          orderId: order.orderId,
          method,
          demoConfirm: true,
          simulateFailure,
        });
        setReceipt(r.receipt);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setPayError(e instanceof ApiError ? e.message : 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const demo = provider === 'demo';

  return (
    <section className="section section--tight pay">
      <div className="container">
        {receipt ? (
          <Receipt r={receipt} />
        ) : (
          <>
            <div className="pay__head">
              <LogoMark size={44} />
              <div>
                <span className="eyebrow">Checkout</span>
                <h1 className="pay__title">Secure payment</h1>
              </div>
              <span className="pay__lock">
                <ShieldIcon /> Secure checkout
              </span>
            </div>
            {demo && (
              <div className="demo-banner" role="note">
                <AlertIcon />
                <div>
                  <strong>Demo Payment Mode</strong>
                  <span>No payment gateway is connected yet. No money will be charged and no real transaction takes place.</span>
                </div>
              </div>
            )}
            {loadError && (
              <FormAlert>
                {loadError} <Link to="/book" className="text-link">Book a shipment</Link>
              </FormAlert>
            )}
            {!shipment && !loadError && <div className="skeleton" style={{ height: 420 }} />}
            {shipment && shipment.status !== 'PENDING_PAYMENT' && (
              <FormAlert kind="info">
                This booking is already paid. Tracking ID <strong>{shipment.trackingId}</strong>.{' '}
                <Link to={`/track?id=${shipment.trackingId}`} className="text-link">
                  Track it
                </Link>
              </FormAlert>
            )}
            {shipment && shipment.status === 'PENDING_PAYMENT' && (
              <div className="pay__grid">
                <PaymentCard amount={shipment.price} demo={demo} loading={paying} error={payError} onPay={pay} />
                <OrderSummary s={shipment} />
              </div>
            )}
            <p className="pay__foot xs muted">
              <LockIcon width={13} /> Payments are verified on our server before a booking is confirmed.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
