import { PageHero } from '../components/layout/PageHero';
import { Photo } from '../components/media/Photo';
import { CTASection } from '../components/sections/CTASection';
import { NetworkSection } from '../components/sections/Network';
import { ExperienceSection, TestimonialsSection } from '../components/sections/Trust';
import { Globe3D } from '../components/three-d/Objects3D';
import { GlobeIcon, HeadsetIcon, PlaneIcon, RouteIcon, ShieldIcon, TruckIcon, BoxesIcon } from '../components/ui/Icons';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { useSeo } from '../lib/seo';

const PILLARS = [
  { icon: <PlaneIcon />, t: 'Air transport', d: 'Domestic air cargo for time-critical shipments, airport-to-airport or door-to-door.' },
  { icon: <TruckIcon />, t: 'Road transport', d: 'Full and part truckload movement between states, with doorstep pickup and delivery.' },
  { icon: <BoxesIcon />, t: 'Movers & Packers', d: 'Home and office relocation — packed, moved and set up by one accountable crew.' },
  { icon: <HeadsetIcon />, t: 'Customer support', d: 'People you can call, email or message about every booking, before and after pickup.' },
  { icon: <ShieldIcon />, t: 'Secure handling', d: 'Proper packing, sealed loads and documented handovers at every milestone.' },
  { icon: <GlobeIcon />, t: 'Nationwide reach', d: 'Pickup and delivery across all 28 States and 8 Union Territories.' },
  { icon: <RouteIcon />, t: 'Technology-driven tracking', d: 'Instant estimates, online booking and a live milestone timeline for each shipment.' },
];

export default function AboutPage() {
  useSeo({
    title: 'About YA² — Moving India Forward',
    description: 'YA² is a modern logistics and transportation company focused on reliable movement of cargo, parcels and household goods across India.',
  });
  return (
    <>
      <PageHero
        crumbs={[{ label: 'About Us' }]}
        eyebrow="About YA²"
        title={
          <>
            Moving India
            <br />
            <span className="text-gradient">forward.</span>
          </>
        }
        text="YA² is a modern logistics and transportation company focused on reliable movement of cargo, parcels and household goods across India."
        art={<Globe3D width={300} className="float-slow" />}
      />

      <section className="section">
        <div className="container about-intro">
          <Reveal className="about-intro__photo">
            <Photo slot="operations" />
          </Reveal>
          <div className="about-intro__copy stack" style={{ ['--stack' as string]: '18px' }}>
            <span className="eyebrow">Who we are</span>
            <h2>Logistics that feels simple on your side.</h2>
            <p className="lead">
              We bring air cargo, road transport and relocation under one roof, so businesses and families deal with one team, one booking flow and one
              tracking ID — whatever they are moving.
            </p>
            <p className="muted">
              Our approach is practical: price estimates you can understand line by line, careful handling from pickup to delivery, and support that
              stays reachable until the job is done. Technology helps — instant quotes, online payments and milestone tracking — but it never replaces
              accountable people.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <SectionHeading eyebrow="What we do" title="Everything it takes to move it right." align="center" />
          <div className="pillars">
            {PILLARS.map((p, i) => (
              <Reveal key={p.t} className="pillar card card--pad card--hover" delay={(i % 4) * 70}>
                <span className="pillar__icon">{p.icon}</span>
                <h3>{p.t}</h3>
                <p className="muted">{p.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ExperienceSection />
      <NetworkSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
