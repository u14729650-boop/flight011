import { SkyBackdrop } from '../components/immersive/SkyBackdrop';
import { ScrollGallery } from '../components/sections/ScrollGallery';
import { PickupDrop } from '../components/location/LocationSelector';
import { CTASection, StepsSection } from '../components/sections/CTASection';
import { Hero } from '../components/sections/Hero';
import { NetworkSection } from '../components/sections/Network';
import { AirPricing, RoadPricing } from '../components/sections/Pricing';
import { ServicesSection } from '../components/sections/Services';
import { SupportSection } from '../components/sections/Support';
import { ExperienceSection, TestimonialsSection } from '../components/sections/Trust';
import { Reveal } from '../components/ui/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { useSeo } from '../lib/seo';

export default function Home() {
  useSeo({
    title: 'YA² Transport | Air, Road & Logistics Across India',
    description:
      'YA² Transport moves cargo, parcels and household goods across India by air and road, with movers & packers, instant price estimates and online shipment tracking.',
  });
  return (
    <div className="immersive">
      <SkyBackdrop />
      <Hero />
      <div className="marquee" aria-hidden>
        <div className="marquee__track">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k}>
              Air Cargo <i>↗</i> Road Transport <i>⟶</i> Full Truckload <i>→</i> Part Truckload <i>→</i> Movers &amp; Packers <i>↗</i> Door-to-door <i>⟶</i>
              Airport-to-airport <i>→</i> Secure handling <i>↗</i> Online tracking <i>⟶</i>{' '}
            </span>
          ))}
        </div>
      </div>
      <ScrollGallery />
      <ServicesSection />
      <NetworkSection />
      <AirPricing />
      <RoadPricing />

      <section className="section" id="pickup-drop">
        <div className="container">
          <SectionHeading
            eyebrow="Pickup & Drop"
            title="Plan the route before you book."
            text="Enter pickup and drop by state, city or pincode to see the estimated route, distance and delivery time on the map."
          />
          <Reveal>
            <PickupDrop />
          </Reveal>
        </div>
      </section>

      <StepsSection />
      <ExperienceSection />
      <TestimonialsSection />
      <SupportSection />
      <CTASection />
    </div>
  );
}
