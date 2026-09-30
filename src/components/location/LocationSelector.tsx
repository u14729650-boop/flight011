import { useId, useMemo, useState, type FormEvent } from 'react';
import { ROAD_DISTANCE_FACTOR, type TransportMode } from '../../config/pricing';
import { citiesInState, findCity } from '../../data/cities';
import { getState, PINCODE_PATTERN, stateFromPincode } from '../../data/indiaStates';
import { haversineKm } from '../../lib/geo';
import { distanceBand, formatTransit, transitFor } from '../../lib/pricing';
import { IndiaMap } from '../map/IndiaMap';
import { AnimatedArrow } from '../ui/AnimatedArrow';
import { Button, ButtonLink } from '../ui/Button';
import { FormAlert, SelectField, StateOptions, TextField } from '../ui/Fields';
import { ClockIcon, InfoIcon, PinIcon, RouteIcon } from '../ui/Icons';

export interface LocationValue {
  state: string;
  city: string;
  pincode: string;
}

export const emptyLocation = (): LocationValue => ({ state: '', city: '', pincode: '' });

/** State → city (with suggestions) → pincode, with pincode/state consistency checks. */
export function LocationFields({
  value,
  onChange,
  errors = {},
  idPrefix,
  labels = { state: 'State', city: 'City', pincode: 'Pincode' },
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  errors?: Partial<Record<keyof LocationValue, string>>;
  idPrefix?: string;
  labels?: { state: string; city: string; pincode: string };
}) {
  const auto = useId().replace(/:/g, '');
  const listId = `${idPrefix ?? auto}-cities`;
  const cities = useMemo(() => citiesInState(value.state), [value.state]);
  const pinState = value.pincode.length === 6 ? stateFromPincode(value.pincode) : undefined;
  const pinMismatch = pinState && value.state && pinState !== value.state;

  return (
    <>
      <SelectField label={labels.state} value={value.state} onChange={(e) => onChange({ ...value, state: e.target.value })} error={errors.state}>
        <StateOptions />
      </SelectField>
      <TextField
        label={labels.city}
        list={listId}
        value={value.city}
        placeholder={cities[0] ? `e.g. ${cities[0].name}` : 'City / town'}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
        error={errors.city}
        autoComplete="address-level2"
      />
      <datalist id={listId}>
        {cities.map((c) => (
          <option key={c.name} value={c.name} />
        ))}
      </datalist>
      <TextField
        label={labels.pincode}
        inputMode="numeric"
        maxLength={6}
        value={value.pincode}
        placeholder="6-digit PIN"
        autoComplete="postal-code"
        onChange={(e) => {
          const pincode = e.target.value.replace(/\D/g, '').slice(0, 6);
          const detected = pincode.length === 6 ? stateFromPincode(pincode) : undefined;
          onChange({ ...value, pincode, state: !value.state && detected ? detected : value.state });
        }}
        error={errors.pincode}
        hint={pinMismatch ? `This PIN looks like ${pinState} — please double-check.` : pinState ? `PIN region: ${pinState}` : undefined}
      />
    </>
  );
}

/** Resolves a location to coordinates: known city → its coords, else the state's reference hub. */
export function resolveLocation(v: LocationValue) {
  const state = getState(v.state);
  if (!state) return null;
  const city = findCity(v.city, v.state);
  return {
    coords: city?.coords ?? state.ref,
    label: city ? city.name : v.city.trim() || state.refCity,
    approximate: !city,
    state: state.name,
  };
}

/** PICKUP & DROP section: map-style UI with simulated route estimates. */
export function PickupDrop() {
  const [pickup, setPickup] = useState<LocationValue>({ state: 'Gujarat', city: 'Ahmedabad', pincode: '380009' });
  const [drop, setDrop] = useState<LocationValue>({ state: 'Delhi', city: 'New Delhi', pincode: '110001' });
  const [mode, setMode] = useState<TransportMode>('ROAD');
  const [shown, setShown] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const a = resolveLocation(pickup);
  const b = resolveLocation(drop);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!a || !b) return setError('Choose both pickup and drop states.');
    for (const [n, v] of [['Pickup', pickup], ['Drop', drop]] as const) {
      if (v.pincode && !PINCODE_PATTERN.test(v.pincode)) return setError(`${n} pincode must be 6 digits and cannot start with 0.`);
    }
    setError(null);
    setShown(true);
  };

  const est = useMemo(() => {
    if (!a || !b) return null;
    const straight = haversineKm(a.coords, b.coords);
    const km = Math.round(mode === 'AIR' ? straight : straight * ROAD_DISTANCE_FACTOR);
    const band = distanceBand(a.state === b.state, straight);
    return { km, transit: formatTransit(transitFor(mode, band.band, 'STANDARD')), band: band.label };
  }, [a, b, mode]);

  const bookParams = new URLSearchParams({
    mode,
    from: pickup.state,
    to: drop.state,
    fromCity: pickup.city,
    toCity: drop.city,
    fromPin: pickup.pincode,
    toPin: drop.pincode,
  });

  return (
    <div className="pd">
      <form className="pd__form card card--pad" onSubmit={onSubmit} noValidate>
        <div className="pd__block">
          <span className="pd__tag pd__tag--pickup">
            <PinIcon /> Pickup location
          </span>
          <div className="form-grid form-grid--3">
            <LocationFields value={pickup} onChange={(v) => (setPickup(v), setShown(false))} idPrefix="pd-pickup" />
          </div>
        </div>
        <div className="pd__connector" aria-hidden>
          <AnimatedArrow direction="down" />
        </div>
        <div className="pd__block">
          <span className="pd__tag pd__tag--drop">
            <PinIcon /> Drop location
          </span>
          <div className="form-grid form-grid--3">
            <LocationFields value={drop} onChange={(v) => (setDrop(v), setShown(false))} idPrefix="pd-drop" />
          </div>
        </div>
        <div className="pd__bottom">
          <div className="segmented pd__mode">
            {(['ROAD', 'AIR'] as TransportMode[]).map((m) => (
              <label key={m}>
                <input type="radio" name="pd-mode" checked={mode === m} onChange={() => setMode(m)} />
                {m === 'ROAD' ? 'By road' : 'By air'}
              </label>
            ))}
          </div>
          <Button type="submit" arrow="right">
            Show route
          </Button>
        </div>
        {error && <FormAlert>{error}</FormAlert>}
      </form>

      <div className="pd__map card">
        <IndiaMap
          className="pd__india"
          animated={shown}
          showLabels={false}
          highlight={[a?.state, b?.state].filter(Boolean) as string[]}
          routes={shown && a && b ? [{ from: a.coords, to: b.coords, mode: mode === 'AIR' ? 'air' : 'road' }] : []}
          markers={[
            ...(a ? [{ coords: a.coords, kind: 'pickup' as const, label: a.label }] : []),
            ...(b ? [{ coords: b.coords, kind: 'drop' as const, label: b.label }] : []),
          ]}
          title="Map with pickup and drop markers"
        />
        {shown && a && b && est && (
          <div className="pd__stats">
            <div className="pd__stat">
              <RouteIcon />
              <div>
                <span>Estimated route</span>
                <strong>
                  {a.label} → {b.label}
                </strong>
              </div>
            </div>
            <div className="pd__stat">
              <PinIcon />
              <div>
                <span>Estimated distance</span>
                <strong className="tabular">
                  ~{est.km.toLocaleString('en-IN')} km {mode === 'AIR' ? '(flight)' : '(road)'}
                </strong>
              </div>
            </div>
            <div className="pd__stat">
              <ClockIcon />
              <div>
                <span>Estimated delivery</span>
                <strong>{est.transit}</strong>
              </div>
            </div>
            <ButtonLink to={`/book?${bookParams}`} size="sm" arrow="right" className="pd__book">
              Book this route
            </ButtonLink>
          </div>
        )}
        <p className="pd__note">
          <InfoIcon /> Simulated estimate from city coordinates{a?.approximate || b?.approximate ? ' (state hub used where the city is not listed)' : ''} — not
          live GPS routing.
        </p>
      </div>
    </div>
  );
}
