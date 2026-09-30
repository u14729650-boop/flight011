import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CONTACT, NAV_LINKS } from '../../config/site';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../brand/Logo';
import { ButtonLink } from '../ui/Button';
import { MailIcon, MenuIcon, PhoneIcon, UserIcon, WhatsAppIcon } from '../ui/Icons';
import { InstagramLink, WhatsAppLink } from '../ui/Social';
import { ThemeToggle } from '../ui/ThemeToggle';
import { MobileMenu } from './MobileMenu';
import { EMAIL_LINK } from '../../lib/links';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="topbar">
          <div className="container header__container topbar__inner">
            <p className="topbar__msg">
              <span className="badge badge--emerald badge--dot badge--live">Pan-India</span>
              Air · Road · Movers &amp; Packers across all 36 States &amp; UTs
            </p>
            <div className="topbar__links">
              <a href={CONTACT.phoneHref}>
                <PhoneIcon /> {CONTACT.phoneDisplay}
              </a>
              <a href={CONTACT.emailHref} {...EMAIL_LINK}>
                <MailIcon /> {CONTACT.email}
              </a>
              <WhatsAppLink className="topbar__icon" label="WhatsApp">
                <WhatsAppIcon />
              </WhatsAppLink>
              <InstagramLink className="topbar__icon" />
            </div>
          </div>
        </div>

        <div className="header__bar">
          <div className="container header__container header__inner">
            <Logo size={38} className="header__logo" />

            <nav className="nav" aria-label="Main">
              {NAV_LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `nav__link ${isActive ? 'active' : ''}`}>
                  {l.label}
                </NavLink>
              ))}
            </nav>

            <div className="header__actions">
              <InstagramLink className="icon-btn header__ig" />
              <ThemeToggle />
              {user ? (
                <Link to="/dashboard" className="header__login" aria-label="My YA² dashboard">
                  <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
                  <span className="header__login-text">
                    My YA<sup>2</sup>
                  </span>
                </Link>
              ) : (
                <Link to="/login" className="header__login">
                  <UserIcon />
                  <span className="header__login-text">Login</span>
                </Link>
              )}
              <ButtonLink to="/calculator" size="sm" arrow="right" className="header__cta">
                Get a Quote
              </ButtonLink>
              <button className="icon-btn menu-toggle" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)}>
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
