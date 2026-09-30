import type { ReactNode } from 'react';
import { CONTACT } from '../../config/site';
import { Pin3D } from '../three-d/Objects3D';
import { AnimatedArrow } from '../ui/AnimatedArrow';
import { ButtonLink } from '../ui/Button';
import { HeadsetIcon, MailIcon, PhoneIcon, WhatsAppIcon } from '../ui/Icons';
import { Reveal } from '../ui/Reveal';
import { WhatsAppButton, WhatsAppLink } from '../ui/Social';

export function SupportCard({ icon, title, text, action }: { icon: ReactNode; title: string; text: ReactNode; action: ReactNode }) {
  return (
    <div className="support-card">
      <span className="support-card__icon">{icon}</span>
      <div>
        <h4>{title}</h4>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}

export function SupportSection() {
  return (
    <section className="section" id="support">
      <div className="container">
        <Reveal className="support">
          <div className="support__copy">
            <span className="eyebrow">Customer support</span>
            <h2>Need help with your shipment?</h2>
            <p className="lead">Talk to a real person about bookings, pickups, delivery updates or a custom quote.</p>
            <div className="support__ctas">
              <ButtonLink href={CONTACT.phoneHref} variant="light" icon={<PhoneIcon width={18} />} arrow="right">
                Call Support
              </ButtonLink>
              <ButtonLink href={CONTACT.emailHref} variant="outline-light" icon={<MailIcon width={18} />} arrow="up-right">
                Email Support
              </ButtonLink>
              <WhatsAppButton text="WhatsApp Us" />
            </div>
          </div>
          <div className="support__cards">
            <SupportCard
              icon={<PhoneIcon />}
              title="Phone"
              text={CONTACT.phoneDisplay}
              action={
                <a href={CONTACT.phoneHref} className="support-card__go arrow-host" aria-label="Call support">
                  <AnimatedArrow direction="up-right" />
                </a>
              }
            />
            <SupportCard
              icon={<MailIcon />}
              title="Email"
              text={CONTACT.email}
              action={
                <a href={CONTACT.emailHref} className="support-card__go arrow-host" aria-label="Email support">
                  <AnimatedArrow direction="up-right" />
                </a>
              }
            />
            <SupportCard
              icon={<WhatsAppIcon />}
              title="WhatsApp"
              text="Chat with our team"
              action={
                <WhatsAppLink className="support-card__go arrow-host" label="WhatsApp support">
                  <AnimatedArrow direction="up-right" />
                </WhatsAppLink>
              }
            />
            <SupportCard icon={<HeadsetIcon />} title="Hours" text={CONTACT.supportHours} action={null} />
          </div>
          <Pin3D className="support__pin float-slow" width={90} tone="emerald" />
        </Reveal>
      </div>
    </section>
  );
}
