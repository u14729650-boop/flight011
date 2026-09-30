import { Link } from 'react-router-dom';
import { COMPANY, CONTACT, FOOTER_COLUMNS } from '../../config/site';
import { Logo } from '../brand/Logo';
import { AnimatedArrow } from '../ui/AnimatedArrow';
import { InstagramIcon, MailIcon, PhoneIcon, WhatsAppIcon } from '../ui/Icons';
import { InstagramLink, WhatsAppLink } from '../ui/Social';
import { EMAIL_LINK } from '../../lib/links';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__glow" aria-hidden />
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Logo tone="light" size={44} />
            <p className="footer__about">
              A modern Indian logistics company moving cargo, parcels and household goods by air and road — with transparent estimates and
              tracking at every step.
            </p>
            <div className="footer__contact">
              <a href={CONTACT.phoneHref} className="arrow-host">
                <PhoneIcon /> {CONTACT.phoneDisplay}
              </a>
              {CONTACT.emails.map((e) => (
                <a key={e} href={CONTACT.emailHref} {...EMAIL_LINK} className="arrow-host">
                  <MailIcon /> {e}
                </a>
              ))}
            </div>
            <div className="footer__social">
              <InstagramLink className="footer__social-link">
                <InstagramIcon /> Instagram
              </InstagramLink>
              <WhatsAppLink className="footer__social-link">
                <WhatsAppIcon /> WhatsApp
              </WhatsAppLink>
            </div>
          </div>

          <div className="footer__cols">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="footer__col">
                <h4>{col.title}</h4>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="arrow-host">
                        {l.label}
                        <AnimatedArrow direction="up-right" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="footer__word" aria-hidden>
          YA<sup>2</sup>
        </div>

        <div className="footer__bottom">
          <p>
            © {COMPANY.copyrightYear} YA<sup>2</sup> Transport. All rights reserved.
          </p>
          <p className="footer__legal">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/faq">FAQ</Link>
            <span>Map data: DataMeet, CC BY 2.5 IN</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
