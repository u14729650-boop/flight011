import type { ReactNode } from 'react';
import { Cargo3D, Truck3D } from '../three-d/Objects3D';
import { ButtonLink } from '../ui/Button';
import { Reveal } from '../ui/Reveal';

export function CTASection({
  title = (
    <>
      Ready when your cargo is.
    </>
  ),
  text = 'Get an instant estimate in under a minute, then book pickup online. Our team confirms every booking personally.',
  primary = { to: '/calculator', label: 'Get a Quote' },
  secondary = { to: '/book', label: 'Book a Shipment' },
}: {
  title?: ReactNode;
  text?: string;
  primary?: { to: string; label: string };
  secondary?: { to: string; label: string };
}) {
  return (
    <section className="section section--tight">
      <div className="container">
        <Reveal className="cta">
          <div className="cta__copy">
            <h2>{title}</h2>
            <p>{text}</p>
            <div className="cta__actions">
              <ButtonLink to={primary.to} variant="light" size="lg" arrow="right">
                {primary.label}
              </ButtonLink>
              <ButtonLink to={secondary.to} variant="outline-light" size="lg" arrow="up-right">
                {secondary.label}
              </ButtonLink>
            </div>
          </div>
          <div className="cta__art" aria-hidden>
            <Truck3D className="cta__truck float-slow" width="100%" title="" />
            <Cargo3D className="cta__box float" width="22%" tone="kraft" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function StepsSection() {
  const steps = [
    { n: '01', t: 'Estimate', d: 'Pick a mode, route and weight. See the full price breakdown instantly.' },
    { n: '02', t: 'Book', d: 'Add sender & receiver details, choose a speed and confirm online.' },
    { n: '03', t: 'Pickup', d: 'Our team collects from your doorstep in the scheduled slot.' },
    { n: '04', t: 'Track', d: 'Follow every milestone with your YA² tracking ID until delivery.' },
  ];
  return (
    <section className="section section--tight">
      <div className="container">
        <div className="steps">
          {steps.map((s, i) => (
            <Reveal key={s.n} className="step" delay={i * 90}>
              <span className="step__n">{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
              {i < steps.length - 1 && (
                <svg className="step__arrow" viewBox="0 0 80 20" aria-hidden>
                  <path d="M2 10h70" className="step__arrow-line" />
                  <path d="M66 4l7 6-7 6" />
                </svg>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
