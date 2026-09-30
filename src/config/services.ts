import type { TransportMode } from './pricing';

export interface ServiceInfo {
  mode: TransportMode;
  slug: string;
  path: string;
  eyebrow: string;
  title: string;
  shortTitle: string;
  tagline: string;
  summary: string;
  features: string[];
  cta: string;
  accent: 'blue' | 'emerald' | 'gold';
  idealFor: string[];
  process: { title: string; text: string }[];
  highlights: { value: string; label: string }[];
  faqs: { q: string; a: string }[];
  seoTitle: string;
  seoDescription: string;
}

export const SERVICES: ServiceInfo[] = [
  {
    mode: 'AIR',
    slug: 'air-transport',
    path: '/air-transport',
    eyebrow: 'Air Cargo',
    title: 'Air Transport',
    shortTitle: 'Air',
    tagline: 'Fast nationwide air cargo.',
    summary:
      'Time-critical cargo moved on scheduled domestic flights between major Indian airports, with pickup, documentation and last-mile delivery handled by one team.',
    features: ['Fast delivery', 'Nationwide coverage', 'Priority cargo', 'Secure handling', 'Airport-to-airport', 'Door-to-door options'],
    cta: 'Explore Air Transport',
    accent: 'blue',
    idealFor: ['Urgent spare parts', 'Pharmaceuticals (non-hazardous)', 'E-commerce replenishment', 'Documents & samples', 'High-value electronics'],
    process: [
      { title: 'Book & document', text: 'Share cargo details online. We confirm the airway bill requirements and packing guidelines.' },
      { title: 'Pickup & screening', text: 'Our team collects the cargo and hands it over for mandatory security screening.' },
      { title: 'Flight & transfer', text: 'Cargo flies on the next suitable domestic departure and is received at the destination hub.' },
      { title: 'Delivery', text: 'Collect at the airport or choose door delivery — tracked at every milestone.' },
    ],
    highlights: [
      { value: '1–2', label: 'Days on most metro routes' },
      { value: '₹250', label: 'Indicative base per KG' },
      { value: '24×7', label: 'Online tracking' },
    ],
    faqs: [
      { q: 'What cannot be sent by air?', a: 'Dangerous goods (flammables, gas cylinders, certain batteries, corrosives) are restricted by aviation security rules. Tell us what you are shipping and we will advise.' },
      { q: 'Is chargeable weight the actual weight?', a: 'Air cargo is charged on the higher of actual and volumetric weight. The calculator uses actual weight; bulky cargo is re-assessed at pickup.' },
      { q: 'Do you offer airport-to-airport only?', a: 'Yes. Choose airport-to-airport to drop and collect cargo yourself, or door-to-door for full-service delivery.' },
    ],
    seoTitle: 'Air Cargo Transport Across India',
    seoDescription: 'Fast domestic air cargo across India with priority handling, airport-to-airport and door-to-door options. Indicative pricing from ₹2,500 for 10 KG.',
  },
  {
    mode: 'ROAD',
    slug: 'road-transport',
    path: '/road-transport',
    eyebrow: 'Surface Logistics',
    title: 'Road Transport',
    shortTitle: 'Road',
    tagline: 'Reliable surface transportation.',
    summary:
      'Cost-effective state-to-state trucking for parcels, pallets and full loads, running on India’s national highway network with doorstep pickup and delivery.',
    features: ['Cost effective', 'Flexible cargo sizes', 'State-to-state delivery', 'Full truckload', 'Part truckload', 'Doorstep delivery'],
    cta: 'Explore Road Transport',
    accent: 'emerald',
    idealFor: ['Retail & wholesale stock', 'Industrial goods', 'Textiles & FMCG', 'Machinery parts', 'Bulk e-commerce'],
    process: [
      { title: 'Quote & book', text: 'Get an instant estimate, then confirm pickup address, cargo and invoice details.' },
      { title: 'Pickup & consolidation', text: 'Cargo is collected and consolidated at the nearest hub (PTL) or loaded directly (FTL).' },
      { title: 'Line haul', text: 'Trucks run on planned highway lanes with hub scans at every checkpoint.' },
      { title: 'Doorstep delivery', text: 'Delivered to the receiver with proof of delivery recorded against your tracking ID.' },
    ],
    highlights: [
      { value: '₹100', label: 'Indicative base per KG' },
      { value: 'FTL · PTL', label: 'Flexible load sizes' },
      { value: '36', label: 'States & UTs served' },
    ],
    faqs: [
      { q: 'What is the difference between FTL and PTL?', a: 'Full Truckload (FTL) reserves an entire vehicle for your cargo. Part Truckload (PTL) shares space with other consignments and is priced by weight.' },
      { q: 'Do I need an e-way bill?', a: 'For commercial goods above the government threshold value, an e-way bill is required. We can guide you through generating it.' },
      { q: 'Can you deliver to remote districts?', a: 'Yes, including hilly and North-Eastern regions, though transit times can be longer. The calculator reflects this with distance bands.' },
    ],
    seoTitle: 'Road Transport & Trucking Across India',
    seoDescription: 'State-to-state road transport across India — full truckload, part truckload and doorstep delivery. Indicative pricing at ₹100 per KG.',
  },
  {
    mode: 'MOVERS',
    slug: 'movers-packers',
    path: '/movers-packers',
    eyebrow: 'Relocation',
    title: 'Movers & Packers',
    shortTitle: 'Movers',
    tagline: 'Complete relocation solutions.',
    summary:
      'Home and office relocation handled end to end — surveyed, packed with quality materials, transported in closed vehicles and set up at your new address.',
    features: ['Home relocation', 'Office relocation', 'Packing', 'Loading', 'Transportation', 'Unloading', 'Unpacking'],
    cta: 'Explore Movers & Packers',
    accent: 'gold',
    idealFor: ['1–4 BHK homes', 'Office & IT equipment', 'Vehicles on carriers (on request)', 'Storage between moves', 'Inter-city transfers'],
    process: [
      { title: 'Survey', text: 'A video or in-person survey lists your items so the quote and vehicle size are accurate.' },
      { title: 'Pack & label', text: 'Multi-layer packing, labelled boxes and an inventory list you sign off.' },
      { title: 'Move', text: 'Loaded into closed vehicles and transported with tracking on your YA² dashboard.' },
      { title: 'Unpack & set up', text: 'Unloaded, unpacked and placed room by room. Packing debris taken away.' },
    ],
    highlights: [
      { value: '7-step', label: 'Handled relocation' },
      { value: 'Closed', label: 'Container vehicles' },
      { value: '1 team', label: 'From packing to set-up' },
    ],
    faqs: [
      { q: 'How is a relocation estimated?', a: 'The calculator uses a crew & packing fee plus a per-KG rate. A survey then confirms volume, floors, lift access and special items.' },
      { q: 'Is transit insurance available?', a: 'Transit insurance can be arranged on request based on the declared value of goods.' },
      { q: 'How early should I book?', a: 'One to two weeks ahead is ideal, especially around month-end and festive seasons.' },
    ],
    seoTitle: 'Movers & Packers — Home & Office Relocation',
    seoDescription: 'Home and office relocation across India: packing, loading, transportation, unloading and unpacking by one accountable team.',
  },
];

export const getService = (mode: TransportMode) => SERVICES.find((s) => s.mode === mode)!;
