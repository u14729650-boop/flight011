import { useMemo, useState } from 'react';
import { CITIES, NETWORK_ROUTES, cityByName } from '../../data/cities';
import { INDIAN_STATES, type Region } from '../../data/indiaStates';
import { IndiaMap, type MapMarker, type MapRoute } from '../map/IndiaMap';
import { AnimatedArrow } from '../ui/AnimatedArrow';
import { PlaneIcon, TruckIcon } from '../ui/Icons';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';

type Filter = 'all' | 'air' | 'road';

/** Cities that get a text label on the network map (others show as dots with a tooltip). */
const LABELS: Record<string, 'left' | 'right'> = {
  'New Delhi': 'right', Mumbai: 'left', Bengaluru: 'left', Chennai: 'right', Kolkata: 'right', Hyderabad: 'right',
  Ahmedabad: 'left', Pune: 'right', Jaipur: 'left', Lucknow: 'right', Guwahati: 'right', Kochi: 'left',
  Bhubaneswar: 'right', Patna: 'right', Srinagar: 'right', 'Port Blair': 'right', Nagpur: 'right', Surat: 'left',
  Indore: 'left', Ludhiana: 'left', Thiruvananthapuram: 'right', Visakhapatnam: 'right', Jodhpur: 'left', Imphal: 'right',
};
const short = (n: string) => (n === 'New Delhi' ? 'Delhi' : n);

export function NetworkSection() {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const featured = useMemo(() => CITIES.filter((c) => c.featured), []);
  const routes: MapRoute[] = useMemo(
    () =>
      NETWORK_ROUTES.filter((r) => filter === 'all' || r.mode === filter).map((r) => ({
        from: cityByName(r.from).coords,
        to: cityByName(r.to).coords,
        mode: r.mode,
        id: `${r.from}-${r.to}`,
      })),
    [filter],
  );
  const markers: MapMarker[] = useMemo(
    () =>
      featured
        .filter((c) => filter === 'all' || !c.hub || c.hub === 'both' || c.hub === filter)
        .map((c) => ({ coords: c.coords, kind: c.hub ? 'hub' : 'city', label: LABELS[c.name] ? short(c.name) : undefined, labelPos: LABELS[c.name], hub: c.hub, name: `${c.name}, ${c.state}` })),
    [featured, filter],
  );
  const hubsInSelected = selected ? CITIES.filter((c) => c.state === selected) : [];
  const regions = useMemo(() => {
    const m = new Map<Region, number>();
    for (const s of INDIAN_STATES) m.set(s.region, (m.get(s.region) ?? 0) + 1);
    return [...m.entries()];
  }, []);
  const airHubs = CITIES.filter((c) => c.hub === 'air' || c.hub === 'both').length;
  const roadHubs = CITIES.filter((c) => c.hub === 'road' || c.hub === 'both').length;

  return (
    <section className="section section--deep network" id="network">
      <div className="container">
        <SectionHeading
          eyebrow="Pan India Network"
          title={
            <>
              One network across <span className="text-gradient">36 States &amp; UTs.</span>
            </>
          }
          text="Airport hubs for time-critical cargo, road hubs for cost-effective surface movement, and pickup & delivery coverage in every State and Union Territory."
        />

        <div className="network__grid">
          <Reveal className="network__map-card">
            <div className="network__toolbar">
              <div className="segmented segmented--dark" role="radiogroup" aria-label="Filter routes">
                {(['all', 'air', 'road'] as Filter[]).map((f) => (
                  <label key={f}>
                    <input type="radio" name="net-filter" checked={filter === f} onChange={() => setFilter(f)} />
                    {f === 'all' ? 'All routes' : f === 'air' ? 'Air' : 'Road'}
                  </label>
                ))}
              </div>
              <ul className="network__legend">
                <li>
                  <i className="lg lg--air" /> Air route
                </li>
                <li>
                  <i className="lg lg--road" /> Road route
                </li>
                <li>
                  <i className="lg lg--hub" /> Logistics hub
                </li>
              </ul>
            </div>
            <IndiaMap
              className="network__map"
              routes={routes}
              markers={markers}
              interactive
              highlight={selected ? [selected] : []}
              onStateSelect={setSelected}
              title="PAN India network map with hubs and routes"
            />
            <p className="network__attrib">Boundaries: DataMeet India (Survey of India outline), CC BY 2.5 IN · Routes are illustrative lanes.</p>
          </Reveal>

          <div className="network__side">
            <Reveal className="network__stats">
              <div>
                <strong>36</strong>
                <span>States &amp; UTs served</span>
              </div>
              <div>
                <strong>{airHubs}</strong>
                <span>Airport hubs</span>
              </div>
              <div>
                <strong>{roadHubs}</strong>
                <span>Road hubs</span>
              </div>
            </Reveal>

            <Reveal className="network__routes" delay={80}>
              <h3>Busy lanes</h3>
              <ul>
                {NETWORK_ROUTES.slice(0, 7).map((r) => (
                  <li key={`${r.from}-${r.to}`} className="arrow-host">
                    <span className={`network__mode network__mode--${r.mode}`}>{r.mode === 'air' ? <PlaneIcon /> : <TruckIcon />}</span>
                    <span className="network__lane">
                      {short(r.from)} <AnimatedArrow direction="long" /> {short(r.to)}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="network__state" delay={140}>
              {selected ? (
                <>
                  <span className="network__state-k">{INDIAN_STATES.find((s) => s.name === selected)?.type}</span>
                  <h3>{selected}</h3>
                  <p>
                    {hubsInSelected.length
                      ? `Pickup & delivery from ${hubsInSelected.map((c) => c.name).join(', ')} and surrounding districts.`
                      : 'Pickup & delivery available via the nearest hub.'}
                  </p>
                </>
              ) : (
                <>
                  <span className="network__state-k">Explore</span>
                  <h3>Tap any state</h3>
                  <p>See the cities we pick up from and deliver to in that State or Union Territory.</p>
                </>
              )}
            </Reveal>

            <Reveal className="network__regions" delay={180}>
              <h3>Coverage by region</h3>
              <ul>
                {regions.map(([r, n]) => (
                  <li key={r}>
                    <span>{r}</span>
                    <strong>
                      {n} {n === 1 ? 'State/UT' : 'States/UTs'}
                    </strong>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
