import type { ReactNode } from 'react';
import { CONTACT } from '../../config/site';
import { useToast } from '../../context/ToastContext';
import { instagramWebUrl, openInstagram, whatsappLink } from '../../lib/links';
import { AnimatedArrow } from './AnimatedArrow';
import { InstagramIcon, WhatsAppIcon } from './Icons';

/**
 * Instagram / WhatsApp links. They always do something useful: open the
 * configured profile/chat, or — until the company supplies them — tell the
 * visitor the channel is coming soon and how to reach us instead.
 */
function useNotConfigured() {
  const toast = useToast();
  return (channel: string) =>
    toast({
      kind: 'info',
      title: `${channel} coming soon`,
      text: `Our official ${channel} will be linked here shortly. Meanwhile call ${CONTACT.phoneDisplay} or email ${CONTACT.email}.`,
    });
}

export function InstagramLink({ className = 'icon-btn', children, label = 'YA² on Instagram' }: { className?: string; children?: ReactNode; label?: string }) {
  const notConfigured = useNotConfigured();
  const href = instagramWebUrl();
  return (
    <a
      href={href ?? '#instagram'}
      className={className}
      aria-label={children ? undefined : label}
      title={label}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        if (!openInstagram()) notConfigured('Instagram');
      }}
    >
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
  const notConfigured = useNotConfigured();
  const href = whatsappLink(message);
  return (
    <a
      href={href ?? '#whatsapp'}
      className={className}
      aria-label={children ? undefined : label}
      title={label}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!href) {
          e.preventDefault();
          notConfigured('WhatsApp');
        }
      }}
    >
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
