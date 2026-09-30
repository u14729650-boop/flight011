import { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CONTACT, NAV_LINKS } from '../../config/site';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../brand/Logo';
import { AnimatedArrow } from '../ui/AnimatedArrow';
import { ButtonLink } from '../ui/Button';
import { CloseIcon, MailIcon, PhoneIcon } from '../ui/Icons';
import { InstagramLink, WhatsAppLink } from '../ui/Social';
import { ThemeToggle } from '../ui/ThemeToggle';
import { EMAIL_LINK } from '../../lib/links';

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLElement>('button, a')?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className={`mm ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="mm__backdrop" onClick={onClose} />
      <div className="mm__panel" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" ref={panel}>
        <div className="mm__top">
          <Logo size={36} />
          <button className="icon-btn" onClick={onClose} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>

        <nav className="mm__nav" aria-label="Mobile">
          {NAV_LINKS.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => `mm__link arrow-host ${isActive ? 'active' : ''}`}
              style={{ ['--i' as string]: i }}
            >
              <span>{l.label}</span>
              <AnimatedArrow direction="right" />
            </NavLink>
          ))}
        </nav>

        <div className="mm__actions">
          <ButtonLink to="/calculator" arrow="right" block>
            Get a Quote
          </ButtonLink>
          <ButtonLink to={user ? '/dashboard' : '/login'} variant="secondary" block>
            {user ? 'My YA² Dashboard' : 'Login'}
          </ButtonLink>
        </div>

        <div className="mm__foot">
          <div className="mm__contact">
            <a href={CONTACT.phoneHref}>
              <PhoneIcon width={16} /> {CONTACT.phoneDisplay}
            </a>
            {CONTACT.emails.map((e) => (
              <a key={e} href={CONTACT.emailHref} {...EMAIL_LINK}>
                <MailIcon width={16} /> {e}
              </a>
            ))}
          </div>
          <div className="mm__row">
            <div className="mm__social">
              <InstagramLink />
              <WhatsAppLink />
            </div>
            <ThemeToggle />
          </div>
          <Link to="/track" className="mm__track link-arrow arrow-host">
            Track a shipment <AnimatedArrow direction="up-right" />
          </Link>
        </div>
      </div>
    </div>
  );
}
