import { ShipmentForm } from '../components/booking/ShipmentForm';
import { PageHero } from '../components/layout/PageHero';
import { useSeo } from '../lib/seo';

export default function BookPage() {
  useSeo({ title: 'Book a Shipment', description: 'Book air, road or movers & packers shipments across India with YA² — calculate the price and pay securely online.' });
  return (
    <>
      <PageHero
        compact
        crumbs={[{ label: 'Book a Shipment' }]}
        eyebrow="Booking"
        title="Book a shipment"
        text="Sender, receiver and cargo details — then calculate the price and continue to secure payment."
      />
      <section className="section section--tight">
        <div className="container">
          <ShipmentForm />
        </div>
      </section>
    </>
  );
}
