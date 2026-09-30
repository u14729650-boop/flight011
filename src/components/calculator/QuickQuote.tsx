import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { TRANSPORT_MODES, type TransportMode } from '../../config/pricing';
import { CITIES, type City } from '../../data/cities';
import { INDIAN_STATES } from '../../data/indiaStates';
import { calculateQuote, validateQuoteInput, type QuoteBreakdown } from '../../lib/pricing';
import { Button } from '../ui/Button';
import { FormAlert, SelectField, TextField } from '../ui/Fields';
import { QuoteResult } from './QuoteResult';

/** Cities grouped by state, for compact pickup/drop selectors. */
export function CityOptions() {
  const groups = useMemo(() => {
    const byState = new Map<string, City[]>();
    for (const c of CITIES) byState.set(c.state, [...(byState.get(c.state) ?? []), c]);
    return INDIAN_STATES.filter((s) => byState.has(s.name)).map((s) => ({ state: s.name, cities: byState.get(s.name)! }));
  }, []);
  return (
    <>
      <option value="" disabled>
        Select city
      </option>
      {groups.map((g) => (
        <optgroup key={g.state} label={g.state}>
          {g.cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

/** Home-page quote experience: pickup, drop, weight, transport → animated result. */
export function QuickQuote() {
  const [from, setFrom] = useState('Ahmedabad');
  const [to, setTo] = useState('New Delhi');
  const [weight, setWeight] = useState('100');
  const [mode, setMode] = useState<TransportMode>('AIR');
  const [quote, setQuote] = useState<QuoteBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const a = CITIES.find((c) => c.name === from);
    const b = CITIES.find((c) => c.name === to);
    if (!a || !b) return setError('Choose pickup and drop cities.');
    const input = {
      mode,
      pickupState: a.state,
      destinationState: b.state,
      weightKg: Number(weight),
      cargoType: mode === 'MOVERS' ? ('HOUSEHOLD' as const) : ('PARCEL' as const),
      speed: 'STANDARD' as const,
      pickupCoords: a.coords,
      destinationCoords: b.coords,
    };
    const err = validateQuoteInput(input);
    setError(err);
    if (err) return setQuote(null);
    setLoading(true);
    setQuote(null);
    // A short beat so the result visibly "arrives".
    window.setTimeout(() => {
      setQuote(calculateQuote(input));
      setLoading(false);
    }, 450);
  };

  const label = (n: string) => (n === 'New Delhi' ? 'Delhi' : n);

  return (
    <div className="qq">
      <form className="qq__form" onSubmit={onSubmit} noValidate>
        <SelectField label="Pickup" value={from} onChange={(e) => setFrom(e.target.value)}>
          <CityOptions />
        </SelectField>
        <SelectField label="Drop" value={to} onChange={(e) => setTo(e.target.value)}>
          <CityOptions />
        </SelectField>
        <TextField label="Weight (KG)" type="number" inputMode="decimal" min={0.5} value={weight} onChange={(e) => setWeight(e.target.value)} />
        <SelectField label="Transport" value={mode} onChange={(e) => setMode(e.target.value as TransportMode)}>
          {(Object.keys(TRANSPORT_MODES) as TransportMode[]).map((m) => (
            <option key={m} value={m}>
              {TRANSPORT_MODES[m].label}
            </option>
          ))}
        </SelectField>
        <Button type="submit" size="lg" arrow="long" loading={loading} className="qq__submit">
          Get my estimate
        </Button>
      </form>
      {error && <FormAlert>{error}</FormAlert>}
      {quote && (
        <div className="qq__result card card--pad">
          <QuoteResult quote={quote} fromLabel={label(from)} toLabel={label(to)} cities={{ from, to }} showBreakdown={false} compact />
          <Link to="/calculator" className="qq__more small text-link">
            See the full price breakdown in the calculator
          </Link>
        </div>
      )}
    </div>
  );
}
