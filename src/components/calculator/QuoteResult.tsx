import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CARGO_TYPES, DELIVERY_SPEEDS, ESTIMATE_NOTE, TRANSPORT_MODES } from '../../config/pricing';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, ApiError } from '../../lib/api';
import { factor, formatINR, formatKg, signedINR } from '../../lib/format';
import type { QuoteBreakdown } from '../../lib/pricing';
import { AnimatedArrow } from '../ui/AnimatedArrow';
import { Button, ButtonLink } from '../ui/Button';
import { CalendarIcon, InfoIcon, PlaneIcon, TruckIcon, BoxesIcon } from '../ui/Icons';

export function bookingLink(q: QuoteBreakdown, cities?: { from?: string; to?: string }) {
  const p = new URLSearchParams({
    mode: q.input.mode,
    from: q.input.pickupState,
    to: q.input.destinationState,
    weight: String(q.input.weightKg),
    cargo: q.input.cargoType,
    speed: q.input.speed,
  });
  if (cities?.from) p.set('fromCity', cities.from);
  if (cities?.to) p.set('toCity', cities.to);
  return `/book?${p}`;
}

const ModeIcon = ({ mode }: { mode: string }) => (mode === 'AIR' ? <PlaneIcon /> : mode === 'ROAD' ? <TruckIcon /> : <BoxesIcon />);

export function QuoteResult({
  quote,
  fromLabel,
  toLabel,
  cities,
  showBreakdown = true,
  compact = false,
}: {
  quote: QuoteBreakdown;
  fromLabel?: string;
  toLabel?: string;
  cities?: { from?: string; to?: string };
  showBreakdown?: boolean;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const q = quote;
  const from = fromLabel ?? q.input.pickupState;
  const to = toLabel ?? q.input.destinationState;

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/quotes', {
        mode: q.input.mode,
        pickupState: q.input.pickupState,
        destinationState: q.input.destinationState,
        pickupCity: cities?.from,
        destinationCity: cities?.to,
        weightKg: q.input.weightKg,
        cargoType: q.input.cargoType,
        speed: q.input.speed,
      });
      toast({ kind: 'success', title: 'Quote saved', text: 'Find it under My Quotes in your dashboard.' });
    } catch (e) {
      toast({ kind: 'error', title: 'Could not save quote', text: e instanceof ApiError ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`quote-result ${compact ? 'quote-result--compact' : ''}`} aria-live="polite">
      <div className="quote-result__head">
        <span className="quote-result__mode">
          <ModeIcon mode={q.input.mode} />
          {TRANSPORT_MODES[q.input.mode].label}
        </span>
        <span className="badge badge--blue">{q.bandLabel}</span>
      </div>

      <div className="quote-result__route">
        <span>{from}</span>
        <AnimatedArrow direction="long" className="quote-result__arrow" />
        <span>{to}</span>
      </div>
      <p className="quote-result__meta">
        {formatKg(q.input.weightKg)} · {CARGO_TYPES[q.input.cargoType].label} · {DELIVERY_SPEEDS[q.input.speed].label} · ~{q.routeKm.toLocaleString('en-IN')} km
      </p>

      <div className="quote-result__grid">
        <div className="quote-result__price">
          <span className="quote-result__label">Estimated Cost</span>
          <strong className="tabular">{formatINR(q.total)}</strong>
        </div>
        <div className="quote-result__eta">
          <span className="quote-result__label">Estimated Delivery</span>
          <strong>
            <CalendarIcon /> {q.transitLabel}
          </strong>
        </div>
      </div>

      {showBreakdown && (
        <dl className="breakdown">
          <div>
            <dt>Base price</dt>
            <dd className="tabular">{formatINR(q.basePrice)}</dd>
          </div>
          <div>
            <dt>
              Distance adjustment <span>{q.bandLabel} · {factor(q.distanceFactor)}</span>
            </dt>
            <dd className="tabular">{signedINR(q.distanceAdjustment)}</dd>
          </div>
          <div>
            <dt>
              Service adjustment <span>{CARGO_TYPES[q.input.cargoType].label} · {factor(q.serviceFactor)}</span>
            </dt>
            <dd className="tabular">{signedINR(q.serviceAdjustment)}</dd>
          </div>
          <div>
            <dt>
              Urgency adjustment <span>{DELIVERY_SPEEDS[q.input.speed].label} · {factor(q.urgencyFactor)}</span>
            </dt>
            <dd className="tabular">{signedINR(q.urgencyAdjustment)}</dd>
          </div>
          <div className="breakdown__total">
            <dt>Final estimated price</dt>
            <dd className="tabular">{formatINR(q.total)}</dd>
          </div>
        </dl>
      )}

      <div className="quote-result__actions">
        <ButtonLink to={bookingLink(q, cities)} arrow="right">
          Book Now
        </ButtonLink>
        {user ? (
          <Button variant="secondary" onClick={save} loading={saving}>
            Save quote
          </Button>
        ) : (
          <Link to="/login?next=/calculator" className="text-link small">
            Log in to save quotes
          </Link>
        )}
      </div>
      <p className="quote-result__note">
        <InfoIcon /> {ESTIMATE_NOTE} Taxes as applicable are confirmed on the final invoice.
      </p>
    </div>
  );
}
