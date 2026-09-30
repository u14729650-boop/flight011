import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { COMPANY, SITE_URL } from '../config/site';

interface Seo {
  title: string;
  description: string;
  /** Pages behind login should not be indexed. */
  noindex?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

/** Sets the document title, description, canonical and Open Graph tags for a page. */
export function useSeo({ title, description, noindex }: Seo) {
  const { pathname } = useLocation();
  useEffect(() => {
    const full = title.includes(COMPANY.name) ? title : `${title} | ${COMPANY.name}`;
    const origin = SITE_URL || window.location.origin;
    const url = `${origin}${pathname}`;
    document.title = full;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', `${origin}/og-image.svg`);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [title, description, noindex, pathname]);
}
