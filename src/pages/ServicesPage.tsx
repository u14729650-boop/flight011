import { Link } from 'react-router-dom';
import { PageHero } from '../components/layout/PageHero';
import { CTASection, StepsSection } from '../components/sections/CTASection';
import { ServiceVisual } from '../components/sections/Services';
import { AnimatedArrow } from '../components/ui/AnimatedArrow';
import { ButtonLink } from '../components/ui/Button';
import { CheckIcon } from '../components/ui/Icons';
import { Reveal } from '../components/ui/Reveal';
import { SERVICES } from '../config/services';
import { useSeo } from '../lib/seo';

export default function ServicesPage() {
  useSeo({
    title: 'Logistics Services — Air, Road, Movers & Packers',
    description: 'Air cargo, road transport (FTL & PTL) and movers & packers across all Indian States and Union Territories, from YA² Transport.',
  });
  return (
    <>
      <PageHero
        crumbs={[{ label: 'Services' }]}
        eyebrow="Services"
        title={
          <>
            Logistics for every
            <br />
            kind of <span className="text-gradient">move.</span>
          </>
        }
        text="Choose speed with air cargo, value with road transport, or a complete relocation with movers & packers. Same booking, tracking and support for all three."
      />
      <section className="section section--tight">
        <div className="container svc-rows">
          {SERVICES.map((s, i) => (
            <Reveal key={s.mode} as="article" className={`svc-row card ${i % 2 ? 'svc-row--flip' : ''}`}>
              <div className="svc-row__visual">
                <ServiceVisual service={s} size="lg" />
              </div>
              <div className="svc-row__copy">
                <span className="eyebrow">{s.eyebrow}</span>
                <h2>{s.title}</h2>
                <p className="lead">{s.summary}</p>
                <ul className="check-list check-list--2">
                  {s.features.map((f) => (
                    <li key={f}>
                      <CheckIcon /> {f}
                    </li>
                  ))}
                </ul>
                <div className="svc-row__actions">
                  <ButtonLink to={s.path} arrow="right">
                    {s.cta}
                  </ButtonLink>
                  <Link to={`/calculator?mode=${s.mode}`} className="link-arrow arrow-host">
                    Estimate price <AnimatedArrow direction="up-right" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <StepsSection />
      <CTASection />
    </>
  );
}
