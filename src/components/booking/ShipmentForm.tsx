import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CARGO_TYPES,
  DELIVERY_SPEEDS,
  TRANSPORT_MODES,
  WEIGHT_LIMITS,
  type CargoType,
  type DeliverySpeed,
  type TransportMode,
} from '../../config/pricing';
import { useAuth } from '../../context/AuthContext';
import { findCity } from '../../data/cities';
import { getState, PINCODE_PATTERN } from '../../data/indiaStates';
import { api, ApiError } from '../../lib/api';
import type { Address, PartyDetails, Shipment } from '../../lib/apiTypes';
import { factor, formatINR, formatKg, signedINR } from '../../lib/format';
import { calculateQuote, validateQuoteInput, type QuoteBreakdown } from '../../lib/pricing';
import { LocationFields } from '../location/LocationSelector';
import { Button } from '../ui/Button';
import { FormAlert, SelectField, TextAreaField, TextField } from '../ui/Fields';
import { InfoIcon, LockIcon, PinIcon } from '../ui/Icons';

const DRAFT_KEY = 'ya2-booking-draft';
const emptyParty = (): PartyDetails => ({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });

interface Draft {
  sender: PartyDetails;
  receiver: PartyDetails;
  weight: string;
  cargoType: CargoType;
  mode: TransportMode;
  speed: DeliverySpeed;
}

const isKey = <T extends object>(obj: T, k: string | null): k is Extract<keyof T, string> => !!k && k in obj;

function initialDraft(params: URLSearchParams): Draft {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (saved && !params.toString()) return JSON.parse(saved) as Draft;
  } catch {
    /* ignore */
  }
  const mode = isKey(TRANSPORT_MODES, params.get('mode')) ? (params.get('mode') as TransportMode) : 'ROAD';
  const from = getState(params.get('from') ?? '')?.name ?? '';
  const to = getState(params.get('to') ?? '')?.name ?? '';
  return {
    sender: { ...emptyParty(), state: from, city: params.get('fromCity') ?? '', pincode: params.get('fromPin') ?? '' },
    receiver: { ...emptyParty(), state: to, city: params.get('toCity') ?? '', pincode: params.get('toPin') ?? '' },
    weight: params.get('weight') ?? '',
    cargoType: isKey(CARGO_TYPES, params.get('cargo')) ? (params.get('cargo') as CargoType) : mode === 'MOVERS' ? 'HOUSEHOLD' : 'PARCEL',
    mode,
    speed: isKey(DELIVERY_SPEEDS, params.get('speed')) ? (params.get('speed') as DeliverySpeed) : 'STANDARD',
  };
}

function partyErrors(p: PartyDetails, prefix: string) {
  const e: Record<string, string> = {};
  if (p.name.trim().length < 2) e[`${prefix}.name`] = 'Enter a name.';
  if (!/^\+?[0-9 ()-]{7,20}$/.test(p.phone.trim())) e[`${prefix}.phone`] = 'Enter a valid phone number.';
  if (p.address.trim().length < 5) e[`${prefix}.address`] = 'Enter the full address.';
  if (p.city.trim().length < 2) e[`${prefix}.city`] = 'Enter the city.';
  if (!getState(p.state)) e[`${prefix}.state`] = 'Choose a state.';
  if (!PINCODE_PATTERN.test(p.pincode)) e[`${prefix}.pincode`] = 'Enter a valid 6-digit pincode.';
  return e;
}

function PartyBlock({
  title,
  kind,
  value,
  onChange,
  errors,
  addresses,
}: {
  title: string;
  kind: 'sender' | 'receiver';
  value: PartyDetails;
  onChange: (p: PartyDetails) => void;
  errors: Record<string, string>;
  addresses: Address[];
}) {
  const e = (k: string) => errors[`${kind}.${k}`];
  return (
    <fieldset className="book__block card card--pad">
      <legend className="book__legend">
        <span className={`pd__tag pd__tag--${kind === 'sender' ? 'pickup' : 'drop'}`}>
          <PinIcon /> {title}
        </span>
        {addresses.length > 0 && (
          <select
            className="select select--sm"
            aria-label={`Use a saved address for ${title.toLowerCase()}`}
            value=""
            onChange={(ev) => {
              const a = addresses.find((x) => x.id === ev.target.value);
              if (a) onChange({ name: a.name, phone: a.phone, address: a.line1, city: a.city, state: a.state, pincode: a.pincode });
            }}
          >
            <option value="">Use saved address…</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} — {a.city}
              </option>
            ))}
          </select>
        )}
      </legend>
      <div className="form-grid form-grid--3">
        <TextField
          label={kind === 'sender' ? 'Sender Name' : 'Receiver Name'}
          value={value.name}
          onChange={(ev) => onChange({ ...value, name: ev.target.value })}
          error={e('name')}
          autoComplete={kind === 'sender' ? 'name' : 'off'}
          className="span-2"
        />
        <TextField
          label={kind === 'sender' ? 'Sender Phone' : 'Receiver Phone'}
          type="tel"
          value={value.phone}
          onChange={(ev) => onChange({ ...value, phone: ev.target.value })}
          error={e('phone')}
          autoComplete={kind === 'sender' ? 'tel' : 'off'}
        />
        <TextAreaField
          className="span-all book__address"
          label={kind === 'sender' ? 'Pickup Address' : 'Drop Address'}
          rows={2}
          placeholder="House / building, street, area, landmark"
          value={value.address}
          onChange={(ev) => onChange({ ...value, address: ev.target.value })}
          error={e('address')}
        />
        <LocationFields
          idPrefix={kind}
          value={{ state: value.state, city: value.city, pincode: value.pincode }}
          onChange={(l) => onChange({ ...value, ...l })}
          errors={{ state: e('state'), city: e('city'), pincode: e('pincode') }}
          labels={
            kind === 'sender'
              ? { state: 'Pickup State', city: 'Pickup City', pincode: 'Pickup Pincode' }
              : { state: 'Drop State', city: 'Drop City', pincode: 'Drop Pincode' }
          }
        />
      </div>
    </fieldset>
  );
}

export function ShipmentForm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [d, setD] = useState<Draft>(() => initialDraft(params));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {
      /* ignore */
    }
    setQuote(null);
  }, [d]);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ addresses: Address[] }>('/addresses')
      .then((r) => setAddresses(r.addresses))
      .catch(() => {});
    setD((x) => (x.sender.name ? x : { ...x, sender: { ...x.sender, name: user.name, phone: user.phone ?? '' } }));
  }, [user]);

  const input = useMemo(
    () => ({
      mode: d.mode,
      cargoType: d.cargoType,
      speed: d.speed,
      weightKg: Number(d.weight),
      pickupState: d.sender.state,
      destinationState: d.receiver.state,
      pickupCoords: findCity(d.sender.city, d.sender.state)?.coords,
      destinationCoords: findCity(d.receiver.city, d.receiver.state)?.coords,
    }),
    [d],
  );

  const calculate = () => {
    const err = validateQuoteInput(input);
    if (err) {
      setError(err);
      setQuote(null);
      return null;
    }
    setError(null);
    const q = calculateQuote(input);
    setQuote(q);
    return q;
  };

  const onContinue = async (e: FormEvent) => {
    e.preventDefault();
    const errs = { ...partyErrors(d.sender, 'sender'), ...partyErrors(d.receiver, 'receiver') };
    setErrors(errs);
    const q = calculate();
    if (Object.keys(errs).length) {
      setError('Please complete the highlighted fields.');
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!q) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent('/book')}`);
      return;
    }
    setLoading(true);
    try {
      const { shipment } = await api.post<{ shipment: Shipment }>('/shipments', {
        sender: d.sender,
        receiver: d.receiver,
        weightKg: Number(d.weight),
        cargoType: d.cargoType,
        mode: d.mode,
        speed: d.speed,
      });
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      navigate(`/payment?shipment=${shipment.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields);
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const lim = WEIGHT_LIMITS[d.mode];

  return (
    <form className="book" onSubmit={onContinue} noValidate>
      <div className="book__main">
        <PartyBlock title="Pickup (sender)" kind="sender" value={d.sender} onChange={(sender) => setD({ ...d, sender })} errors={errors} addresses={addresses} />
        <PartyBlock title="Drop (receiver)" kind="receiver" value={d.receiver} onChange={(receiver) => setD({ ...d, receiver })} errors={errors} addresses={addresses} />

        <fieldset className="book__block card card--pad">
          <legend className="book__legend">
            <span className="pd__tag">Cargo &amp; service</span>
          </legend>
          <div className="form-grid">
            <SelectField label="Transport Mode" value={d.mode} onChange={(e) => setD({ ...d, mode: e.target.value as TransportMode })}>
              {(Object.keys(TRANSPORT_MODES) as TransportMode[]).map((m) => (
                <option key={m} value={m}>
                  {TRANSPORT_MODES[m].label}
                </option>
              ))}
            </SelectField>
            <SelectField label="Delivery Speed" value={d.speed} onChange={(e) => setD({ ...d, speed: e.target.value as DeliverySpeed })}>
              {(Object.keys(DELIVERY_SPEEDS) as DeliverySpeed[]).map((s) => (
                <option key={s} value={s}>
                  {DELIVERY_SPEEDS[s].label} — {DELIVERY_SPEEDS[s].note}
                </option>
              ))}
            </SelectField>
            <TextField
              label="Weight (KG)"
              type="number"
              inputMode="decimal"
              min={lim.min}
              max={lim.max}
              value={d.weight}
              onChange={(e) => setD({ ...d, weight: e.target.value })}
              error={errors.weightKg}
              hint={`${lim.min}–${lim.max.toLocaleString('en-IN')} KG`}
            />
            <SelectField label="Cargo Type" value={d.cargoType} onChange={(e) => setD({ ...d, cargoType: e.target.value as CargoType })}>
              {(Object.keys(CARGO_TYPES) as CargoType[]).map((c) => (
                <option key={c} value={c}>
                  {CARGO_TYPES[c].label}
                </option>
              ))}
            </SelectField>
          </div>
        </fieldset>
      </div>

      <aside className="book__side">
        <div className="book__summary card card--pad">
          <h3>Price summary</h3>
          {quote ? (
            <>
              <p className="book__route">
                {d.sender.city || d.sender.state} → {d.receiver.city || d.receiver.state}
              </p>
              <p className="muted small">
                {TRANSPORT_MODES[d.mode].label} · {formatKg(Number(d.weight))} · {CARGO_TYPES[d.cargoType].label}
              </p>
              <dl className="breakdown breakdown--compact">
                <div>
                  <dt>Base price</dt>
                  <dd className="tabular">{formatINR(quote.basePrice)}</dd>
                </div>
                <div>
                  <dt>
                    Distance <span>{factor(quote.distanceFactor)}</span>
                  </dt>
                  <dd className="tabular">{signedINR(quote.distanceAdjustment)}</dd>
                </div>
                <div>
                  <dt>
                    Service <span>{factor(quote.serviceFactor)}</span>
                  </dt>
                  <dd className="tabular">{signedINR(quote.serviceAdjustment)}</dd>
                </div>
                <div>
                  <dt>
                    Urgency <span>{factor(quote.urgencyFactor)}</span>
                  </dt>
                  <dd className="tabular">{signedINR(quote.urgencyAdjustment)}</dd>
                </div>
                <div className="breakdown__total">
                  <dt>Estimated price</dt>
                  <dd className="tabular">{formatINR(quote.total)}</dd>
                </div>
              </dl>
              <p className="small">
                Estimated delivery: <strong>{quote.transitLabel}</strong>
              </p>
            </>
          ) : (
            <p className="muted small">Fill in the states, weight and service, then calculate to see your estimate.</p>
          )}
          {error && <FormAlert>{error}</FormAlert>}
          <div className="book__actions">
            <Button variant="secondary" onClick={calculate} block>
              Calculate Price
            </Button>
            <Button type="submit" arrow="right" block loading={loading} icon={<LockIcon width={17} />}>
              Continue to Payment
            </Button>
          </div>
          {!user && <p className="xs muted">You will be asked to log in before payment. Your details are kept on this device.</p>}
          <p className="xs muted book__fine">
            <InfoIcon width={14} /> Prices are estimates. Final quotation may vary.
          </p>
        </div>
      </aside>
    </form>
  );
}
