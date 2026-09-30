import { Link } from 'react-router-dom';
import { PageHero } from '../components/layout/PageHero';
import { CTASection } from '../components/sections/CTASection';
import { SupportSection } from '../components/sections/Support';
import { Cargo3D } from '../components/three-d/Objects3D';
import { ButtonLink } from '../components/ui/Button';
import { SectionHeading } from '../components/ui/SectionHeading';
import { COMPANY, CONTACT } from '../config/site';
import { SERVICES } from '../config/services';
import { useSeo } from '../lib/seo';
import { EMAIL_LINK } from '../lib/links';
import { EmailLinks } from '../components/ui/EmailLinks';

const GENERAL_FAQS = [
  { q: 'How do I get a price?', a: 'Use the calculator: choose the transport mode, pickup and destination states, weight, cargo type and speed. You will see the base price, every adjustment and the estimated delivery time.' },
  { q: 'Are the prices on the website final?', a: 'They are indicative estimates. The final quotation can change with exact pickup location, destination, cargo type, dimensions, urgency and applicable taxes.' },
  { q: 'How do I book a shipment?', a: 'Create an account, open Book a Shipment, fill in sender and receiver details, calculate the price and continue to payment. Your tracking ID is issued after payment.' },
  { q: 'How do I track my shipment?', a: 'Enter your tracking ID (for example YA2-2026-001284) on the Track Shipment page, or open the shipment from your dashboard.' },
  { q: 'Which states do you serve?', a: 'Pickup and delivery are available across all 28 States and 8 Union Territories. Remote and island locations can take longer.' },
  { q: 'Which payment methods are supported?', a: 'UPI, credit card, debit card, net banking and wallets. The website currently runs in demo payment mode while the payment gateway is being set up — no money is charged.' },
  { q: 'Can I change or cancel a booking?', a: `Contact support before pickup at ${CONTACT.phoneDisplay}, ${CONTACT.emails.join(' or ')} and we will help you reschedule or cancel.` },
];

export function FaqPage() {
  useSeo({ title: 'FAQ & Help Center', description: 'Answers to common questions about YA² pricing, booking, payment, tracking and coverage.' });
  return (
    <>
      <PageHero compact crumbs={[{ label: 'FAQ' }]} eyebrow="Help Center" title="Frequently asked questions" text="Quick answers about pricing, booking, tracking and coverage." />
      <section className="section section--tight">
        <div className="container container--narrow">
          <SectionHeading eyebrow="General" title="Booking & tracking" />
          <div className="faq-list">
            {GENERAL_FAQS.map((f) => (
              <details key={f.q} className="faq">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          {SERVICES.map((s) => (
            <div key={s.mode} className="faq-group">
              <SectionHeading eyebrow={s.eyebrow} title={s.title} />
              <div className="faq-list">
                {s.faqs.map((f) => (
                  <details key={f.q} className="faq">
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <SupportSection />
    </>
  );
}

function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero compact crumbs={[{ label: title }]} eyebrow="Legal" title={title} text={`Last updated ${updated}`} />
      <section className="section section--tight">
        <div className="container container--narrow legal">{children}</div>
      </section>
    </>
  );
}

export function TermsPage() {
  useSeo({ title: 'Terms of Service', description: 'Terms that apply to quotes, bookings, payments and deliveries with YA² Transport.' });
  return (
    <LegalPage title="Terms of Service" updated="September 2026">
      <p className="legal__notice">This is a general template for the prototype website. Have it reviewed by a qualified legal professional before launch.</p>
      <h2>1. About these terms</h2>
      <p>These terms govern your use of the {COMPANY.name} website and services, including price estimates, bookings, payments and shipment tracking.</p>
      <h2>2. Quotes and estimates</h2>
      <p>Prices shown on the website are indicative estimates. The final quotation may vary based on pickup location, destination, cargo type, dimensions, urgency and applicable taxes. We will confirm any change before pickup.</p>
      <h2>3. Bookings</h2>
      <p>You are responsible for accurate sender, receiver and cargo details. Restricted or dangerous goods must be declared; we may refuse cargo that does not meet safety or legal requirements.</p>
      <h2>4. Payments</h2>
      <p>Payments are processed by our payment partner. While the website is in demo payment mode, no money is collected and demo bookings are not dispatched.</p>
      <h2>5. Transit and delivery</h2>
      <p>Delivery times are estimates and can be affected by weather, regulatory checks, strikes, road or flight disruptions and other events outside our control.</p>
      <h2>6. Liability and insurance</h2>
      <p>Our liability for loss or damage is limited as set out in the booking confirmation. Transit insurance can be arranged on request based on declared value.</p>
      <h2>7. Contact</h2>
      <p>
        Questions about these terms: <EmailLinks />.
      </p>
    </LegalPage>
  );
}

export function PrivacyPage() {
  useSeo({ title: 'Privacy Policy', description: 'How YA² Transport collects, uses and protects your personal information.' });
  return (
    <LegalPage title="Privacy Policy" updated="September 2026">
      <p className="legal__notice">This is a general template for the prototype website. Have it reviewed for compliance with the Digital Personal Data Protection Act, 2023 before launch.</p>
      <h2>What we collect</h2>
      <p>Account details (name, email, phone), pickup and delivery addresses, shipment details, payment status and messages you send us. Passwords are stored only as salted one-way hashes.</p>
      <h2>How we use it</h2>
      <p>To provide quotes, bookings, pickups, deliveries, tracking and customer support, to prevent fraud, and to meet legal obligations.</p>
      <h2>Sharing</h2>
      <p>We share only what is needed with delivery partners, airlines and payment processors to complete your shipment. We do not sell personal data.</p>
      <h2>Cookies</h2>
      <p>We use a strictly necessary session cookie to keep you signed in and local storage to remember your theme preference.</p>
      <h2>Your choices</h2>
      <p>
        You can update your profile in your dashboard or ask us to access, correct or delete your data at{' '}
        <EmailLinks />
        .
      </p>
    </LegalPage>
  );
}

export function CareersPage() {
  useSeo({ title: 'Careers at YA²', description: 'Work with YA² Transport in operations, logistics, customer support and technology.' });
  return (
    <>
      <PageHero
        compact
        crumbs={[{ label: 'Careers' }]}
        eyebrow="Careers"
        title="Build India’s logistics with us"
        text="We look for people who care about getting things there — in operations, fleet coordination, customer support and technology."
        art={<Cargo3D width={150} className="float-slow" tone="emerald" />}
      />
      <section className="section section--tight">
        <div className="container container--narrow">
          <div className="empty">
            <h4>No open roles are listed right now</h4>
            <p>
              Send your CV and the role you are interested in to{' '}
              <EmailLinks />{' '}
              and we will reach out when a matching position opens.
            </p>
            <ButtonLink href={CONTACT.emailHref} {...EMAIL_LINK} arrow="up-right">
              Email your CV
            </ButtonLink>
          </div>
        </div>
      </section>
      <CTASection />
    </>
  );
}

export function NotFoundPage() {
  useSeo({ title: 'Page not found', description: 'The page you are looking for could not be found.', noindex: true });
  return (
    <section className="section notfound">
      <div className="container container--narrow">
        <Cargo3D width={160} className="float-slow" tone="blue" />
        <span className="eyebrow">Error 404</span>
        <h1>This parcel took a wrong turn.</h1>
        <p className="lead">The page you are looking for does not exist or has moved.</p>
        <div className="notfound__actions">
          <ButtonLink to="/" arrow="right">
            Back to home
          </ButtonLink>
          <ButtonLink to="/track" variant="secondary" arrow="up-right">
            Track a shipment
          </ButtonLink>
        </div>
        <p className="small muted">
          Or <Link to="/contact" className="text-link">contact support</Link>.
        </p>
      </div>
    </section>
  );
}
