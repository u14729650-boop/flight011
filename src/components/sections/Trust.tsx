import { COMPANY_STATS, CUSTOMER_RATING, SHOW_SAMPLE_NOTICES, TESTIMONIALS } from '../../config/site';
import { Photo } from '../media/Photo';
import { Arrow3D } from '../three-d/Objects3D';
import { Counter, Reveal } from '../ui/Reveal';
import { QuoteIcon, StarIcon } from '../ui/Icons';
import { SectionHeading } from '../ui/SectionHeading';

export function Stars({ value, outOf = 5 }: { value: number; outOf?: number }) {
  return (
    <span className="stars" aria-label={`${value} out of ${outOf} stars`}>
      {Array.from({ length: outOf }, (_, i) => (
        <StarIcon key={i} className={i < Math.round(value) ? '' : 'off'} />
      ))}
    </span>
  );
}

export function StatsCard({ value, suffix, label, index }: { value: number; suffix: string; label: string; index: number }) {
  return (
    <Reveal className="stat-card" delay={index * 80}>
      <strong className="stat-card__value">
        <Counter value={value} suffix={suffix} />
      </strong>
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__bar" aria-hidden />
    </Reveal>
  );
}

export function ExperienceSection() {
  return (
    <section className="section" id="experience">
      <div className="container">
        <div className="exp">
          <div className="exp__copy">
            <SectionHeading
              eyebrow="Experience"
              title="Built around experience."
              text="Our teams have planned lanes, packed homes and handled time-critical cargo across India for years. That experience shows up as fewer surprises: clear estimates, careful handling and people who pick up the phone."
            />
            <div className="stats-grid">
              {COMPANY_STATS.map((s, i) => (
                <StatsCard key={s.label} {...s} index={i} />
              ))}
            </div>
            {SHOW_SAMPLE_NOTICES && <p className="sample-note">Company statistics shown are editable figures maintained by YA².</p>}
          </div>
          <Reveal className="exp__visual" delay={120}>
            <Photo slot="warehouse" className="exp__photo" />
            <div className="exp__badge card">
              <Arrow3D width={64} />
              <div>
                <strong>Every shipment</strong>
                <span>booked, tracked &amp; supported by one team</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function TestimonialCard({ t, index }: { t: (typeof TESTIMONIALS)[number]; index: number }) {
  const initials = t.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);
  return (
    <Reveal as="figure" className="t-card card card--hover" delay={(index % 3) * 80}>
      <div className="t-card__top">
        <Stars value={t.rating} />
        <span className="badge">{t.service}</span>
      </div>
      <QuoteIcon className="t-card__q" />
      <blockquote>“{t.quote}”</blockquote>
      <figcaption>
        <span className="t-card__avatar" aria-hidden>
          {initials}
        </span>
        <span>
          <strong>— {t.name}</strong>
          <span>
            {t.role}, {t.city}
          </span>
        </span>
      </figcaption>
    </Reveal>
  );
}

export function RatingPanel() {
  return (
    <Reveal className="rating card">
      <span className="eyebrow">Customer rating</span>
      <div className="rating__score">
        <strong className="tabular">{CUSTOMER_RATING.score.toFixed(1)}</strong>
        <span>/ {CUSTOMER_RATING.outOf}</span>
      </div>
      <Stars value={CUSTOMER_RATING.score} outOf={CUSTOMER_RATING.outOf} />
      <p className="rating__basis">{CUSTOMER_RATING.basis}</p>
      <ul className="rating__bars" aria-label="Rating highlights">
        {CUSTOMER_RATING.highlights.map(({ label: k, percent: v }) => (
          <li key={k}>
            <span>{k}</span>
            <span className="rating__bar">
              <span style={{ width: `${v}%` }} />
            </span>
          </li>
        ))}
      </ul>
      <p className="rating__fine">Collected from YA² customer feedback — not a third-party verified rating.</p>
    </Reveal>
  );
}

export function TestimonialsSection() {
  return (
    <section className="section section--alt" id="reviews">
      <div className="container">
        <SectionHeading eyebrow="What customers say" title="Trusted by businesses and families." />
        <div className="t-layout">
          <RatingPanel />
          <div className="t-grid">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} t={t} index={i} />
            ))}
          </div>
        </div>
        {SHOW_SAMPLE_NOTICES && <p className="sample-note t-note">Sample testimonials — replace with verified customer reviews in src/config/site.ts.</p>}
      </div>
    </section>
  );
}
