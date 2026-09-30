/**
 * YA² Transport — central site configuration.
 *
 * Everything that describes the company (name, contact details, social
 * profiles, navigation, stats, testimonials) lives here so it is edited in
 * one place. Values marked "EDITABLE" are demo/sample content and should be
 * replaced with real company data before launch.
 */

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const COMPANY = {
  name: 'YA² Transport',
  shortName: 'YA²',
  /** Plain-text version for places that cannot render the superscript. */
  asciiName: 'YA2 Transport',
  tagline: 'Moving India Forward.',
  description:
    'Reliable air, road and relocation solutions designed to move your business, cargo and belongings safely across India.',
  foundedYear: 2016, // EDITABLE
  copyrightYear: 2026,
} as const;

export const CONTACT = {
  email: 'ljpun072@gmail.com',
  /** Clicking the email address opens Gmail online. */
  emailHref: 'https://mail.google.com/',
  phoneDisplay: '+1 (555) 019-9238',
  phoneHref: 'tel:+15550199238',
  /** EDITABLE — shown on the contact page. */
  supportHours: 'Monday – Saturday, 9:00 AM – 7:00 PM IST',
} as const;

/**
 * Social profiles. Empty = the buttons open instagram.com / WhatsApp Web.
 * Set them to open the company profile / a chat with the company number.
 *
 * WhatsApp: full international number, digits only, e.g. "919876543210".
 * Instagram: the profile username without "@", e.g. "ya2transport".
 * Both can also be set at build time with VITE_WHATSAPP_NUMBER / VITE_INSTAGRAM_USERNAME.
 */
export const SOCIAL = {
  whatsappNumber: (env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, ''),
  whatsappDefaultMessage: 'Hello YA² Transport, I would like help with a shipment.',
  instagramUsername: (env.VITE_INSTAGRAM_USERNAME ?? '').replace(/^@/, ''),
} as const;

/** Public site origin used for canonical / Open Graph URLs. */
export const SITE_URL = (env.VITE_SITE_URL ?? '').replace(/\/$/, '');

/**
 * When true, sample content (stats, testimonials, ratings) carries a small
 * "sample" note. Set to false once real, verifiable figures are in place.
 */
export const SHOW_SAMPLE_NOTICES = true;

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/air-transport', label: 'Air Transport' },
  { to: '/road-transport', label: 'Road Transport' },
  { to: '/movers-packers', label: 'Movers & Packers' },
  { to: '/track', label: 'Track Shipment' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About' },
      { to: '/about#experience', label: 'Experience' },
      { to: '/contact', label: 'Contact' },
      { to: '/careers', label: 'Careers' },
    ],
  },
  {
    title: 'Services',
    links: [
      { to: '/air-transport', label: 'Air Transport' },
      { to: '/road-transport', label: 'Road Transport' },
      { to: '/movers-packers', label: 'Movers & Packers' },
      { to: '/pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Quick Links',
    links: [
      { to: '/track', label: 'Track Shipment' },
      { to: '/calculator', label: 'Get a Quote' },
      { to: '/calculator', label: 'Calculator' },
      { to: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Support',
    links: [
      { to: '/faq', label: 'Help Center' },
      { to: '/contact', label: 'Contact Support' },
      { to: '/terms', label: 'Terms' },
      { to: '/privacy', label: 'Privacy' },
    ],
  },
] as const;

/** EDITABLE — company statistics (demo values). */
export const COMPANY_STATS = [
  { value: 10, suffix: '+', label: 'Years Experience' },
  { value: 25, suffix: 'K+', label: 'Shipments Delivered' },
  { value: 500, suffix: '+', label: 'Cities Covered' },
  { value: 98, suffix: '%', label: 'Customer Satisfaction' },
] as const;

/** EDITABLE — must reflect real customer feedback before launch. */
export const CUSTOMER_RATING = {
  score: 4.8,
  outOf: 5,
  basis: 'Based on customer feedback',
  highlights: [
    { label: 'On-time delivery', percent: 94 },
    { label: 'Handling & packing', percent: 96 },
    { label: 'Communication', percent: 97 },
  ],
} as const;

/** EDITABLE — sample testimonials, replace with real customer feedback. */
export const TESTIMONIALS = [
  {
    quote: 'Professional service, clear communication and reliable delivery. Our Surat textile consignments reached Delhi a day earlier than planned.',
    name: 'Rakesh Patel',
    role: 'Operations Head, textile wholesaler',
    city: 'Surat',
    service: 'Road Transport',
    rating: 5,
  },
  {
    quote: 'We moved our entire 3BHK from Pune to Hyderabad. The packing team labelled every box and nothing was damaged. Stress-free.',
    name: 'Ananya Kulkarni',
    role: 'Home relocation',
    city: 'Pune',
    service: 'Movers & Packers',
    rating: 5,
  },
  {
    quote: 'Urgent spare parts had to reach our Chennai plant overnight. The air cargo team handled the paperwork and kept us updated at every step.',
    name: 'Vikram Iyer',
    role: 'Procurement Manager',
    city: 'Bengaluru',
    service: 'Air Transport',
    rating: 5,
  },
  {
    quote: 'Transparent pricing — the estimate matched the final invoice. The tracking page is simple enough for our whole team to use.',
    name: 'Farah Siddiqui',
    role: 'Founder, D2C home décor brand',
    city: 'Lucknow',
    service: 'Road Transport',
    rating: 5,
  },
  {
    quote: 'Office relocation over a weekend with zero downtime on Monday. Well planned, punctual crew and careful with our IT equipment.',
    name: 'Arjun Mehta',
    role: 'Admin Manager',
    city: 'Ahmedabad',
    service: 'Movers & Packers',
    rating: 4,
  },
  {
    quote: 'Good coordination for our Kolkata to Guwahati part-truckload shipments. Support answers the phone, which matters a lot.',
    name: 'Sourav Banerjee',
    role: 'Distributor',
    city: 'Kolkata',
    service: 'Road Transport',
    rating: 5,
  },
] as const;
