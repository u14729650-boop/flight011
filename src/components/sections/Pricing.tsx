import { AIR_REFERENCE_PRICES, PRICING_DISCLAIMER, ROAD_BASE_RATE_PER_KG, ROAD_REFERENCE_PRICES, type RatePoint } from '../../config/pricing';
import { formatINR, formatNumber } from '../../lib/format';
import { AnimatedArrow } from '../ui/AnimatedArrow';
import { ButtonLink } from '../ui/Button';
import { InfoIcon, PlaneIcon, TruckIcon } from '../ui/Icons';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';

export function PricingCard({
  point,
  mode,
  featured,
  index,
}: {
  point: RatePoint;
  mode: 'AIR' | 'ROAD';
  featured?: boolean;
  index: number;
}) {
  const perKg = point.price / point.kg;
  const params = new URLSearchParams({ mode, weight: String(point.kg) });
  return (
    <Reveal as="article" className={`price-card card card--hover ${featured ? 'price-card--featured' : ''}`} delay={index * 80}>
      {featured && <span className="price-card__flag">Most booked</span>}
      <div className="price-card__head">
        <span className={`price-card__icon price-card__icon--${mode.toLowerCase()}`}>{mode === 'AIR' ? <PlaneIcon /> : <TruckIcon />}</span>
        <span className="price-card__mode">{mode === 'AIR' ? 'Air Cargo' : 'Road Transport'}</span>
      </div>
      <div className="price-card__weight">
        <span className="tabular">{formatNumber(point.kg)}</span> KG
      </div>
      <div className="price-card__price tabular">{formatINR(point.price)}</div>
      <p className="price-card__per">
        {formatINR(perKg)} / KG · Standard, same-state base
      </p>
      <ButtonLink to={`/calculator?${params}`} variant={featured ? 'primary' : 'secondary'} arrow="right" block>
        Calculate for my route
      </ButtonLink>
    </Reveal>
  );
}

export function AirPricing() {
  return (
    <section className="section" id="air-pricing">
      <div className="container">
        <SectionHeading
          eyebrow="Indicative Air Transport Pricing"
          title="Air cargo pricing"
          text="Straightforward reference prices for domestic air cargo. Route, cargo type and urgency are applied transparently in the calculator."
        />
        <div className="price-grid">
          {AIR_REFERENCE_PRICES.map((p, i) => (
            <PricingCard key={p.kg} point={p} mode="AIR" featured={i === 1} index={i} />
          ))}
        </div>
        <PricingNote />
      </div>
    </section>
  );
}

export function RoadPricing() {
  return (
    <section className="section section--alt" id="road-pricing">
      <div className="container">
        <SectionHeading
          eyebrow="Indicative Road Transport Pricing"
          title="Road transport pricing"
          text={
            <>
              A simple base calculation of <strong className="nowrap">{formatINR(ROAD_BASE_RATE_PER_KG)} / KG</strong> for the displayed road prices — distance
              and service adjustments are shown line by line when you calculate.
            </>
          }
        />
        <div className="price-grid">
          {ROAD_REFERENCE_PRICES.map((p, i) => (
            <PricingCard key={p.kg} point={p} mode="ROAD" featured={i === 1} index={i} />
          ))}
        </div>
        <div className="rate-strip">
          <span className="rate-strip__label">Base calculation</span>
          <span className="rate-strip__formula tabular">
            Weight (KG) × {formatINR(ROAD_BASE_RATE_PER_KG)} <AnimatedArrow direction="long" /> Base price
          </span>
          <span className="rate-strip__eg tabular">e.g. 15 KG × ₹100 = ₹1,500</span>
        </div>
        <PricingNote />
      </div>
    </section>
  );
}

export function PricingNote() {
  return (
    <p className="pricing-note">
      <InfoIcon /> {PRICING_DISCLAIMER}
    </p>
  );
}
