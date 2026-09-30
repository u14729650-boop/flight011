import { useState, type FormEvent } from 'react';
import { PageHero } from '../components/layout/PageHero';
import { SupportCard } from '../components/sections/Support';
import { AnimatedArrow } from '../components/ui/AnimatedArrow';
import { Button, ButtonLink } from '../components/ui/Button';
import { FormAlert, TextAreaField, TextField } from '../components/ui/Fields';
import { CheckCircleIcon, ClockIcon, InstagramIcon, MailIcon, PhoneIcon, WhatsAppIcon } from '../components/ui/Icons';
import { InstagramLink, WhatsAppLink } from '../components/ui/Social';
import { CONTACT } from '../config/site';
import { api, ApiError } from '../lib/api';
import { useSeo } from '../lib/seo';
import { EMAIL_LINK } from '../lib/links';

const empty = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactPage() {
  useSeo({ title: 'Contact YA²', description: `Contact YA² Transport by phone ${CONTACT.phoneDisplay}, email ${CONTACT.emails.join(' or ')}, WhatsApp or Instagram.` });
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (form.phone && !/^\+?[0-9 ()-]{7,20}$/.test(form.phone)) errs.phone = 'Enter a valid phone number.';
    if (form.subject.trim().length < 3) errs.subject = 'Add a subject.';
    if (form.message.trim().length < 10) errs.message = 'Tell us a little more (at least 10 characters).';
    return errs;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setError(null);
    try {
      const { reference } = await api.post<{ reference: string }>('/contact', form);
      setSent(reference);
      setForm(empty);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHero
        compact
        crumbs={[{ label: 'Contact' }]}
        eyebrow="Contact"
        title={
          <>
            Contact YA<sup className="sq">2</sup>
          </>
        }
        text="Questions about a quote, a pickup or an ongoing shipment? Reach us on the channel you prefer."
      />
      <section className="section section--tight">
        <div className="container contact">
          <div className="contact__info">
            <SupportCard
              icon={<MailIcon />}
              title="Email"
              text={<>{CONTACT.emails.map((e) => (
                <span key={e} className="support-card__line">
                  {e.split('@')[0]}@<wbr />{e.split('@')[1]}
                </span>
              ))}</>}
              action={
                <a href={CONTACT.emailHref} {...EMAIL_LINK} className="support-card__go arrow-host" aria-label="Send an email">
                  <AnimatedArrow direction="up-right" />
                </a>
              }
            />
            <SupportCard
              icon={<PhoneIcon />}
              title="Phone"
              text={CONTACT.phoneDisplay}
              action={
                <a href={CONTACT.phoneHref} className="support-card__go arrow-host" aria-label="Call">
                  <AnimatedArrow direction="up-right" />
                </a>
              }
            />
            <SupportCard
              icon={<WhatsAppIcon />}
              title="WhatsApp"
              text="Chat with our support team"
              action={
                <WhatsAppLink className="support-card__go arrow-host" label="Open WhatsApp chat">
                  <AnimatedArrow direction="up-right" />
                </WhatsAppLink>
              }
            />
            <SupportCard
              icon={<InstagramIcon />}
              title="Instagram"
              text="Follow YA² for updates"
              action={
                <InstagramLink className="support-card__go arrow-host" label="Open Instagram">
                  <AnimatedArrow direction="up-right" />
                </InstagramLink>
              }
            />
            <SupportCard icon={<ClockIcon />} title="Support hours" text={CONTACT.supportHours} action={null} />
          </div>

          <div className="contact__form card card--pad">
            {sent ? (
              <div className="success-state">
                <CheckCircleIcon width={56} height={56} />
                <h2>Message sent</h2>
                <p className="muted">
                  Thank you — your reference is <strong className="tabular">{sent}</strong>. Our team replies by email within one business day.
                </p>
                <div className="success-state__actions">
                  <Button variant="secondary" onClick={() => setSent(null)}>
                    Send another message
                  </Button>
                  <ButtonLink to="/track" arrow="right">
                    Track a shipment
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="stack" style={{ ['--stack' as string]: '20px' }}>
                <div>
                  <h2 className="form-title">Send us a message</h2>
                  <p className="muted small">We usually respond within one business day.</p>
                </div>
                {error && <FormAlert>{error}</FormAlert>}
                <div className="form-grid">
                  <TextField label="Name" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" required />
                  <TextField label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" required />
                  <TextField label="Phone" type="tel" optional value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
                  <TextField label="Subject" value={form.subject} onChange={set('subject')} error={errors.subject} required />
                  <TextAreaField className="span-all" label="Message" value={form.message} onChange={set('message')} error={errors.message} required />
                </div>
                <Button type="submit" size="lg" arrow="right" loading={loading}>
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
