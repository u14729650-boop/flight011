import { Calculator } from '../components/calculator/Calculator';
import { PageHero } from '../components/layout/PageHero';
import { PickupDrop } from '../components/location/LocationSelector';
import { SupportSection } from '../components/sections/Support';
import { SectionHeading } from '../components/ui/SectionHeading';
import { useSeo } from '../lib/seo';

export default function CalculatorPage() {
  useSeo({
    title: 'Delivery Price Calculator — Get a Quote',
    description: 'Calculate an instant estimate for air, road or movers & packers between any two Indian States or UTs, with a transparent breakdown and delivery time.',
  });
  return (
    <>
      <PageHero
        compact
        crumbs={[{ label: 'Calculator' }]}
        eyebrow="Get a quote"
        title="Calculate your delivery price"
        text="Transparent, deterministic estimates: the same inputs always give the same price, and every adjustment is shown."
      />
      <section className="section section--tight">
        <div className="container">
          <Calculator />
        </div>
      </section>
      <section className="section section--alt">
        <div className="container">
          <SectionHeading eyebrow="Pickup & Drop" title="Check the route on the map" />
          <PickupDrop />
        </div>
      </section>
      <SupportSection />
    </>
  );
}
