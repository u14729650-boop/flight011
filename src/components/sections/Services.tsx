import { Link } from 'react-router-dom';
import { SERVICES, type ServiceInfo } from '../../config/services';
import { Cargo3D, Plane3D, Truck3D } from '../three-d/Objects3D';
import { AnimatedArrow } from '../ui/AnimatedArrow';
import { CheckIcon } from '../ui/Icons';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';
import { ButtonLink } from '../ui/Button';

export function ServiceVisual({ service, size = 'md' }: { service: ServiceInfo; size?: 'md' | 'lg' }) {
  return (
    <div className={`svc-visual svc-visual--${service.accent} svc-visual--${size}`} aria-hidden>
      <div className="svc-visual__ring" />
      {service.mode === 'AIR' && <Plane3D className="svc-visual__obj float-slow" width="88%" />}
      {service.mode === 'ROAD' && <Truck3D className="svc-visual__obj float-slow" width="86%" title="" />}
      {service.mode === 'MOVERS' && (
        <div className="svc-visual__boxes float-slow">
          <Cargo3D width="44%" tone="kraft" />
          <Cargo3D width="34%" tone="kraft" />
          <Cargo3D width="26%" tone="emerald" />
        </div>
      )}
    </div>
  );
}

export function ServiceCard({ service, index }: { service: ServiceInfo; index: number }) {
  return (
    <Reveal as="article" className={`svc-card card card--hover svc-card--${service.accent}`} delay={index * 90}>
      <div className="svc-card__top">
        <span className="svc-card__num">0{index + 1}</span>
        <span className="svc-card__eyebrow">{service.eyebrow}</span>
      </div>
      <ServiceVisual service={service} />
      <h3 className="svc-card__title">{service.title}</h3>
      <p className="svc-card__tag">{service.tagline}</p>
      <ul className="svc-card__features">
        {service.features.map((f) => (
          <li key={f}>
            <CheckIcon /> {f}
          </li>
        ))}
      </ul>
      <Link to={service.path} className="svc-card__cta arrow-host">
        {service.cta}
        <span className="svc-card__cta-icon">
          <AnimatedArrow direction="right" />
        </span>
      </Link>
    </Reveal>
  );
}

export function ServicesSection({ heading = true }: { heading?: boolean }) {
  return (
    <section className="section section--alt" id="services">
      <div className="container">
        {heading && (
          <SectionHeading
            eyebrow="What we move"
            title={
              <>
                Three ways to move.
                <br />
                One accountable team.
              </>
            }
            text="From a 5 KG parcel to a full household, choose the mode that fits your timeline and budget — every shipment is booked, tracked and supported the same way."
            action={
              <ButtonLink to="/services" variant="secondary" arrow="up-right">
                All services
              </ButtonLink>
            }
          />
        )}
        <div className="svc-grid">
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.mode} service={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
