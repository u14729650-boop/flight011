import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHero } from '../components/layout/PageHero';
import { IndiaMap } from '../components/map/IndiaMap';
import { SupportSection } from '../components/sections/Support';
import { Pin3D } from '../components/three-d/Objects3D';
import { TrackingTimeline } from '../components/tracking/TrackingTimeline';
import { Button } from '../components/ui/Button';
import { FormAlert } from '../components/ui/Fields';
import { CalendarIcon, PackageIcon, PinIcon, ScaleIcon, SearchIcon } from '../components/ui/Icons';
import { TRANSPORT_MODES } from '../config/pricing';
import { CITIES } from '../data/cities';
import { getState } from '../data/indiaStates';
import { api, ApiError } from '../lib/api';
import { STAGE_LABELS, type TrackingResult } from '../lib/apiTypes';
import { formatDate, formatKg } from '../lib/format';
import { useSeo } from '../lib/seo';

const DEMO_IDS = ['YA2-2026-001284', 'YA2-2026-001285', 'YA2-2026-001290', 'YA2-2026-001301'];

/** Best-effort coordinates for "City, State" labels. */
function coordsFor(label: string): [number, number] | null {
  const [city, state] = label.split(',').map((s) => s.trim());
  const c = CITIES.find((x) => x.name === city || (city === 'Delhi' && x.name === 'New Delhi'));
  if (c) return c.coords;
  const s = getState(state ?? '');
  return s ? s.ref : null;
}

export default function TrackPage() {
  useSeo({ title: 'Track Your Shipment', description: 'Track a YA² shipment with your tracking ID (e.g. YA2-2026-001284) and see every milestone from pickup to delivery.' });
  const [params, setParams] = useSearchParams();
  const [id, setId] = useState(params.get('id') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResult | null>(null);

  const lookup = async (raw: string) => {
    const tid = raw.trim().toUpperCase();
    if (!/^YA2-\d{4}-\d{6}$/.test(tid)) {
      setError('Enter a tracking ID in the format YA2-2026-001284.');
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { tracking } = await api.get<{ tracking: TrackingResult }>(`/track/${encodeURIComponent(tid)}`);
      setResult(tracking);
      setParams({ id: tid }, { replace: true });
    } catch (e) {
      setResult(null);
      setError(e instanceof ApiError ? e.message : 'Could not load tracking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = params.get('id');
    if (q) void lookup(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void lookup(id);
  };

  const from = result ? coordsFor(result.pickup) : null;
  const to = result ? coordsFor(result.destination) : null;
  const here = result ? coordsFor(result.currentLocation) : null;

  return (
    <>
      <PageHero
        compact
        crumbs={[{ label: 'Track Shipment' }]}
        eyebrow="Tracking"
        title="Track your shipment"
        text="Enter your YA² tracking ID to see where your shipment is and when it will arrive."
        art={<Pin3D width={130} className="float-slow" tone="blue" />}
      >
        <form className="track-form" onSubmit={onSubmit} noValidate>
          <label htmlFor="tid" className="visually-hidden">
            Tracking ID
          </label>
          <div className="track-form__field">
            <SearchIcon />
            <input
              id="tid"
              className="track-form__input"
              placeholder="YA2-2026-001284"
              value={id}
              onChange={(e) => setId(e.target.value.toUpperCase())}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <Button type="submit" size="lg" arrow="right" loading={loading}>
            Track Shipment
          </Button>
        </form>
        <p className="track-demo">
          Demo IDs:{' '}
          {DEMO_IDS.map((d) => (
            <button key={d} type="button" onClick={() => (setId(d), void lookup(d))}>
              {d}
            </button>
          ))}
        </p>
      </PageHero>

      <section className="section section--tight">
        <div className="container">
          {error && <FormAlert>{error}</FormAlert>}
          {loading && !result && <div className="skeleton" style={{ height: 320 }} />}
          {result && (
            <div className="track-result">
              <div className="track-summary card card--pad">
                <div className="track-summary__head">
                  <div>
                    <span className="xs muted strong">TRACKING ID</span>
                    <h2 className="tabular">{result.trackingId}</h2>
                  </div>
                  <span className={`badge ${result.status === 'DELIVERED' ? 'badge--emerald' : 'badge--blue'} badge--dot`}>
                    {STAGE_LABELS[result.status]}
                  </span>
                </div>
                {result.isDemo && <p className="xs muted">Demo shipment for testing the tracking experience.</p>}
                <dl className="track-kv">
                  <div className="kv">
                    <dt>
                      <PinIcon /> Current location
                    </dt>
                    <dd>{result.currentLocation}</dd>
                  </div>
                  <div className="kv">
                    <dt>
                      <CalendarIcon /> {result.status === 'DELIVERED' ? 'Delivered on' : 'Estimated delivery'}
                    </dt>
                    <dd>{result.estimatedDelivery ? formatDate(result.estimatedDelivery, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</dd>
                  </div>
                  <div className="kv">
                    <dt>
                      <PackageIcon /> Transport mode
                    </dt>
                    <dd>{TRANSPORT_MODES[result.mode].label}</dd>
                  </div>
                  <div className="kv">
                    <dt>
                      <ScaleIcon /> Weight
                    </dt>
                    <dd>{formatKg(result.weightKg)}</dd>
                  </div>
                  <div className="kv">
                    <dt>Pickup</dt>
                    <dd>{result.pickup}</dd>
                  </div>
                  <div className="kv">
                    <dt>Destination</dt>
                    <dd>{result.destination}</dd>
                  </div>
                </dl>
                {from && to && (
                  <IndiaMap
                    className="track-map"
                    showLabels={false}
                    routes={[{ from, to, mode: result.mode === 'AIR' ? 'air' : 'road' }]}
                    markers={[
                      { coords: from, kind: 'pickup', label: result.pickup.split(',')[0] },
                      { coords: to, kind: 'drop', label: result.destination.split(',')[0] },
                      ...(here && result.status !== 'DELIVERED' ? [{ coords: here, kind: 'hub' as const }] : []),
                    ]}
                    title="Shipment route map"
                  />
                )}
              </div>
              <div className="card card--pad">
                <h3 className="track-tl-h">Shipment timeline</h3>
                <TrackingTimeline status={result.status} events={result.events} />
              </div>
            </div>
          )}
          {!result && !error && !loading && (
            <div className="empty">
              <PackageIcon width={34} height={34} />
              <h4>Your tracking details will appear here</h4>
              <p>Tracking IDs are sent after payment and are also listed in your dashboard.</p>
            </div>
          )}
        </div>
      </section>
      <SupportSection />
    </>
  );
}
