import { SOCIAL } from '../config/site';

/** Links open the online sites in a new tab. */
export const EMAIL_LINK = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** WhatsApp Web — straight to a chat when a business number is configured. */
export function whatsappLink(message: string = SOCIAL.whatsappDefaultMessage): string {
  if (!SOCIAL.whatsappNumber) return 'https://web.whatsapp.com/';
  return `https://web.whatsapp.com/send?phone=${SOCIAL.whatsappNumber}&text=${encodeURIComponent(message)}`;
}

/** Instagram online — the company profile once a username is configured. */
export function instagramWebUrl(): string {
  return SOCIAL.instagramUsername ? `https://www.instagram.com/${encodeURIComponent(SOCIAL.instagramUsername)}/` : 'https://www.instagram.com/';
}
