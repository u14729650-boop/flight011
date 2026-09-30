import type { ReactNode } from 'react';
import { instagramWebUrl, whatsappLink } from '../../lib/links';
import { AnimatedArrow } from './AnimatedArrow';
import { InstagramIcon, WhatsAppIcon } from './Icons';

/** Instagram / WhatsApp links: open instagram.com and WhatsApp Web in a new tab. */
export function InstagramLink({ className = 'icon-btn', children, label = 'YA² on Instagram' }: { className?: string; children?: ReactNode; label?: string }) {
  return (
    <a href={instagramWebUrl()} className={className} aria-label={children ? undefined : label} title={label} target="_blank" rel="noopener noreferrer">
      {children ?? <InstagramIcon />}
    </a>
  );
}

export function WhatsAppLink({
  className = 'icon-btn',
  children,
  message,
  label = 'Chat with YA² on WhatsApp',
}: {
  className?: string;
  children?: ReactNode;
  message?: string;
  label?: string;
}) {
  return (
    <a href={whatsappLink(message)} className={className} aria-label={children ? undefined : label} title={label} target="_blank" rel="noopener noreferrer">
      {children ?? <WhatsAppIcon />}
    </a>
  );
}

export function WhatsAppButton({ variant = 'emerald', message, text = 'Chat on WhatsApp' }: { variant?: string; message?: string; text?: string }) {
  return (
    <WhatsAppLink className={`btn btn--${variant} arrow-host`} message={message}>
      <WhatsAppIcon width={20} height={20} />
      <span>{text}</span>
      <AnimatedArrow direction="up-right" />
    </WhatsAppLink>
  );
}

export function WhatsAppFloat() {
  return (
    <WhatsAppLink className="wa-float no-print">
      <WhatsAppIcon />
      <span>Chat on WhatsApp</span>
    </WhatsAppLink>
  );
}
