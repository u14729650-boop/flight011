import { SOCIAL } from '../config/site';

/** Official WhatsApp click-to-chat link, or null until a business number is configured. */
export function whatsappLink(message: string = SOCIAL.whatsappDefaultMessage): string | null {
  if (!SOCIAL.whatsappNumber) return null;
  return `https://wa.me/${SOCIAL.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Instagram profile URL, or null until the company username is configured. */
export function instagramWebUrl(): string | null {
  return SOCIAL.instagramUsername ? `https://www.instagram.com/${encodeURIComponent(SOCIAL.instagramUsername)}/` : null;
}

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/**
 * Opens the Instagram profile. On phones it first tries the Instagram app
 * (instagram:// scheme) and falls back to the web profile, which itself
 * opens the app via universal links when installed.
 */
export function openInstagram(): boolean {
  const web = instagramWebUrl();
  if (!web) return false;
  if (isMobile()) {
    const started = Date.now();
    const fallback = window.setTimeout(() => {
      if (Date.now() - started < 1600 && document.visibilityState === 'visible') window.location.href = web;
    }, 900);
    window.addEventListener('pagehide', () => window.clearTimeout(fallback), { once: true });
    window.location.href = `instagram://user?username=${encodeURIComponent(SOCIAL.instagramUsername)}`;
  } else {
    window.open(web, '_blank', 'noopener,noreferrer');
  }
  return true;
}
