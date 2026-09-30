import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CARGO_TYPES,
  DELIVERY_SPEEDS,
  TRANSPORT_MODES,
  WEIGHT_LIMITS,
  type CargoType,
  type DeliverySpeed,
  type TransportMode,
} from '../../config/pricing';
import { getState } from '../../data/indiaStates';
import { calculateQuote, validateQuoteInput, type QuoteBreakdown } from '../../lib/pricing';
import { Button } from '../ui/Button';
import { SelectField, StateOptions, TextField, FormAlert } from '../ui/Fields';
import { BoxesIcon, PlaneIcon, TruckIcon } from '../ui/Icons';
import { Cargo3D } from '../three-d/Objects3D';
import { QuoteResult } from './QuoteResult';

const MODE_ICONS: Record<TransportMode, ReactElement> = { AIR: <PlaneIcon />, ROAD: <TruckIcon />, MOVERS: <BoxesIcon /> };

const isMode = (v: string | null): v is TransportMode => !!v && v in TRANSPORT_MODES;
const isCargo = (v: string | null): v is CargoType => !!v && v in CARGO_TYPES;
const isSpeed = (v: string | null): v is DeliverySpeed => !!v && v in DELIVERY_SPEEDS;

/** Full transparent price calculator (Calculator page + service pages). */
export function Calculator({ defaultMode }: { defaultMode?: TransportMode }) {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<TransportMode>(isMode(params.get('mode')) ? (params.get('mode') as TransportMode) : defaultMode ?? 'AIR');
  const [pickupState, setPickupState] = useState(getState(params.get('from') ?? '') ? params.get('from')! : '');
  const [destinationState, setDestinationState] = useState(getState(params.get('to') ?? '') ? params.get('to')! : '');
  const [weight, setWeight] = useState(params.get('weight') ?? '');
  const [cargoType, setCargoType] = useState<CargoType>(isCargo(params.get('cargo')) ? (params.get('cargo') as CargoType) : 'PARCEL');
  const [speed, setSpeed] = useState<DeliverySpeed>(isSpeed(params.get('speed')) ? (params.get('speed') as DeliverySpeed) : 'STANDARD');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'MOVERS' && cargoType === 'PARCEL') setCargoType('HOUSEHOLD');
  }, [mode, cargoType]);

  const input = { mode, pickupState, destinationState, weightKg: Number(weight), cargoType, speed };

  // After the first estimate, keep the result live as inputs change.
  const quote: QuoteBreakdown | null = useMemo(() => {
    if (!submitted) return null;
    return validateQuoteInput(input) ? null : calculateQuote(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, mode, pickupState, destinationState, weight, cargoType, speed]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = validateQuoteInput(input);
    setError(err);
    setSubmitted(true);
    if (!err && window.matchMedia('(max-width: 1024px)').matches) {
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  };

  useEffect(() => {
    if (submitted) setError(validateQuoteInput(input));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pickupState, destinationState, weight, cargoType, speed]);

  const lim = WEIGHT_LIMITS[mode];

  return (
    <div className="calc">
      <form className="calc__form card card--pad" onSubmit={onSubmit} noValidate>
        <div className="calc__title">
          <span className="eyebrow">Smart price calculator</span>
          <h2 className="calc__h">Calculate your delivery price</h2>
        </div>

        <fieldset className="calc__fieldset">
          <legend className="field__label">Transport mode</legend>
          <div className="segmented segmented--wrap mode-seg">
            {(Object.keys(TRANSPORT_MODES) as TransportMode[]).map((m) => (
              <label key={m}>
                <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
                <span className="mode-seg__icon">{MODE_ICONS[m]}</span>
                {m === 'MOVERS' ? 'MOVERS & PACKERS' : m}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-grid">
          <SelectField label="Pickup state" value={pickupState} onChange={(e) => setPickupState(e.target.value)} required>
            <StateOptions />
          </SelectField>
          <SelectField label="Destination state" value={destinationState} onChange={(e) => setDestinationState(e.target.value)} required>
            <StateOptions />
          </SelectField>
          <TextField
            label="Weight (KG)"
            type="number"
            inputMode="decimal"
            min={lim.min}
            max={lim.max}
            step="0.5"
            placeholder={mode === 'MOVERS' ? 'e.g. 1200' : 'e.g. 100'}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            hint={`${lim.min}–${lim.max.toLocaleString('en-IN')} KG for ${TRANSPORT_MODES[mode].short.toLowerCase()}`}
            required
          />
          <SelectField label="Cargo type" value={cargoType} onChange={(e) => setCargoType(e.target.value as CargoType)}>
            {(Object.keys(CARGO_TYPES) as CargoType[]).map((c) => (
              <option key={c} value={c}>
                {CARGO_TYPES[c].label}
              </option>
            ))}
          </SelectField>
        </div>

        <fieldset className="calc__fieldset">
          <legend className="field__label">Delivery speed</legend>
          <div className="segmented">
            {(Object.keys(DELIVERY_SPEEDS) as DeliverySpeed[]).map((s) => (
              <label key={s}>
                <input type="radio" name="speed" value={s} checked={speed === s} onChange={() => setSpeed(s)} />
                {DELIVERY_SPEEDS[s].label}
                <small>{DELIVERY_SPEEDS[s].note}</small>
              </label>
            ))}
          </div>
        </fieldset>

        {error && submitted && <FormAlert>{error}</FormAlert>}

        <Button type="submit" size="lg" arrow="long" block>
          Get my estimate
        </Button>
      </form>

      <div className="calc__result" ref={resultRef}>
        {quote ? (
          <div className="calc__result-card card card--pad" key={`${quote.total}-${quote.input.mode}`}>
            <QuoteResult quote={quote} />
          </div>
        ) : (
          <div className="calc__placeholder card card--pad">
            <Cargo3D width={130} tone="blue" className="float-slow" />
            <h3>Your estimate appears here</h3>
            <p className="muted">
              Choose a mode, both states and the weight. You will see the base price, every adjustment and the estimated delivery time — no
              hidden steps.
            </p>
            <ul className="calc__formula">
              <li>Base price</li>
              <li>× distance / state factor</li>
              <li>× service factor</li>
              <li>× urgency factor</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
