import { PageHero } from '../components/layout/PageHero';
import { CTASection } from '../components/sections/CTASection';
import { AirPricing, RoadPricing } from '../components/sections/Pricing';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { CARGO_TYPES, DELIVERY_SPEEDS, DISTANCE_BANDS, MOVERS_RATES } from '../config/pricing';
import { factor, formatINR } from '../lib/format';
import { useSeo } from '../lib/seo';

export default function PricingPage() {
  useSeo({
    title: 'Pricing — Air Cargo & Road Transport Rates',
    description: 'Indicative YA² pricing: air cargo from ₹2,500 for 10 KG, road transport at ₹100 per KG, with transparent distance, service and urgency factors.',
  });
  return (
    <>
      <PageHero
        crumbs={[{ label: 'Pricing' }]}
        eyebrow="Pricing"
        title={
          <>
            Transparent pricing,
            <br />
            <span className="text-gradient">line by line.</span>
          </>
        }
        text="Reference prices for air and road, and exactly how route, cargo type and urgency change them. These are indicative prototype rates set by YA² — not official carrier tariffs."
      />
      <AirPricing />
      <RoadPricing />
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="How the estimate is built"
            title="Base × distance × service × urgency"
            text={`Movers & Packers use a ${formatINR(MOVERS_RATES.crewAndPackingFee)} crew & packing fee plus ${formatINR(MOVERS_RATES.perKg)} / KG as the base, then the same factors apply.`}
          />
          <div className="factor-grid">
            <Reveal className="factor card card--pad">
              <h3>Distance / state factor</h3>
              <table className="factor__table">
                <tbody>
                  {DISTANCE_BANDS.map((b) => (
                    <tr key={b.band}>
                      <td>{b.label}</td>
                      <td className="muted">{b.band === 'SAME_STATE' ? 'within one state' : b.maxKm === Infinity ? '> 1,700 km' : `≤ ${b.maxKm.toLocaleString('en-IN')} km`}</td>
                      <td className="tabular strong">{factor(b.factor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
            <Reveal className="factor card card--pad" delay={80}>
              <h3>Service factor (cargo type)</h3>
              <table className="factor__table">
                <tbody>
                  {Object.values(CARGO_TYPES).map((c) => (
                    <tr key={c.label}>
                      <td>{c.label}</td>
                      <td className="muted">{c.note}</td>
                      <td className="tabular strong">{factor(c.factor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
            <Reveal className="factor card card--pad" delay={160}>
              <h3>Urgency factor</h3>
              <table className="factor__table">
                <tbody>
                  {Object.values(DELIVERY_SPEEDS).map((s) => (
                    <tr key={s.label}>
                      <td>{s.label}</td>
                      <td className="muted">{s.note}</td>
                      <td className="tabular strong">{factor(s.factor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="xs muted factor__fine">Distance is measured between the pickup and drop reference points. These multipliers are prototype values and can be edited in src/config/pricing.ts.</p>
            </Reveal>
          </div>
        </div>
      </section>
      <CTASection />
    </>
  );
}
