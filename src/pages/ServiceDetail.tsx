import { Calculator } from '../components/calculator/Calculator';
import { PageHero } from '../components/layout/PageHero';
import { Photo } from '../components/media/Photo';
import { CTASection } from '../components/sections/CTASection';
import { AirPricing, RoadPricing } from '../components/sections/Pricing';
import { ServiceVisual } from '../components/sections/Services';
import { SupportSection } from '../components/sections/Support';
import { ButtonLink } from '../components/ui/Button';
import { CheckIcon } from '../components/ui/Icons';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { MOVERS_RATES, PRICING_DISCLAIMER, type TransportMode } from '../config/pricing';
import { getService } from '../config/services';
import type { MediaSlot } from '../config/media';
import { formatINR } from '../lib/format';
import { useSeo } from '../lib/seo';

const PHOTOS: Record<TransportMode, MediaSlot> = { AIR: 'airCargo', ROAD: 'highway', MOVERS: 'movingBoxes' };

export default function ServiceDetail({ mode }: { mode: TransportMode }) {
  const s = getService(mode);
  useSeo({ title: s.seoTitle, description: s.seoDescription });

  return (
    <>
      <PageHero
        crumbs={[{ to: '/services', label: 'Services' }, { label: s.title }]}
        eyebrow={s.eyebrow}
        title={s.title}
        text={s.summary}
        art={<ServiceVisual service={s} size="lg" />}
      >
        <div className="page-hero__ctas">
          <ButtonLink to={`/book?mode=${s.mode}`} size="lg" arrow="right">
            Book {s.shortTitle === 'Movers' ? 'a move' : `${s.shortTitle.toLowerCase()} shipment`}
          </ButtonLink>
          <ButtonLink href="#estimate" size="lg" variant="secondary" arrow="down">
            Estimate price
          </ButtonLink>
        </div>
        <div className="svc-highlights">
          {s.highlights.map((h) => (
            <div key={h.label}>
              <strong>{h.value}</strong>
              <span>{h.label}</span>
            </div>
          ))}
        </div>
      </PageHero>

      <section className="section">
        <div className="container svc-detail">
          <Reveal className="svc-detail__photo">
            <Photo slot={PHOTOS[mode]} />
          </Reveal>
          <div>
            <SectionHeading eyebrow="What’s included" title={s.tagline} />
            <ul className="check-list check-list--2 check-list--lg">
              {s.features.map((f) => (
                <li key={f}>
                  <CheckIcon /> {f}
                </li>
              ))}
            </ul>
            <h3 className="svc-detail__h">Ideal for</h3>
            <div className="chip-row">
              {s.idealFor.map((x) => (
                <span key={x} className="badge">
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <SectionHeading eyebrow="How it works" title="From booking to delivery" align="center" />
          <ol className="process">
            {s.process.map((p, i) => (
              <Reveal as="li" key={p.title} className="process__step card card--pad" delay={i * 80}>
                <span className="process__n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{p.title}</h3>
                <p className="muted">{p.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {mode === 'AIR' && <AirPricing />}
      {mode === 'ROAD' && <RoadPricing />}
      {mode === 'MOVERS' && (
        <section className="section">
          <div className="container">
            <SectionHeading
              eyebrow="Indicative relocation pricing"
              title="How moves are estimated"
              text={`A crew & packing fee of ${formatINR(MOVERS_RATES.crewAndPackingFee)} plus ${formatINR(MOVERS_RATES.perKg)} per KG of goods, adjusted for distance and urgency. A free survey confirms the final quote.`}
            />
            <div className="movers-examples">
              {[
                { label: '1 BHK', kg: 800 },
                { label: '2 BHK', kg: 1500 },
                { label: '3 BHK', kg: 2500 },
              ].map((x, i) => (
                <Reveal key={x.label} className="price-card card" delay={i * 80}>
                  <div className="price-card__weight">{x.label}</div>
                  <div className="price-card__price tabular">{formatINR(MOVERS_RATES.crewAndPackingFee + MOVERS_RATES.perKg * x.kg)}</div>
                  <p className="price-card__per">Approx. {x.kg.toLocaleString('en-IN')} KG · same-state base</p>
                  <ButtonLink to={`/calculator?mode=MOVERS&weight=${x.kg}&cargo=HOUSEHOLD`} variant="secondary" arrow="right" block>
                    Calculate for my route
                  </ButtonLink>
                </Reveal>
              ))}
            </div>
            <p className="pricing-note">{PRICING_DISCLAIMER}</p>
          </div>
        </section>
      )}

      <section className="section section--alt" id="estimate">
        <div className="container">
          <Calculator defaultMode={mode} />
        </div>
      </section>

      <section className="section">
        <div className="container container--narrow">
          <SectionHeading eyebrow="FAQ" title={`${s.title} questions`} />
          <div className="faq-list">
            {s.faqs.map((f) => (
              <details key={f.q} className="faq">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <SupportSection />
      <CTASection primary={{ to: `/book?mode=${s.mode}`, label: 'Book now' }} secondary={{ to: '/track', label: 'Track Shipment' }} />
    </>
  );
}
