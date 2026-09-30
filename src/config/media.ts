/**
 * Photography slots.
 *
 * Each slot has an art-direction brief. Put a licensed, professionally shot
 * photo in /public/images and set `src` (e.g. '/images/highway.jpg'). Until a
 * photo is supplied, the slot renders a branded 3D illustration of the same
 * scene instead of a random stock image.
 *
 * Grading: cool deep-blue shadows, neutral greys, emerald/blue highlights.
 * Recommended size: 1600×1100 (WebP or AVIF, < 250 KB).
 */
export type MediaSlot = 'highway' | 'airCargo' | 'warehouse' | 'workers' | 'parcels' | 'movingBoxes' | 'operations' | 'truckFleet';

export interface MediaItem {
  src: string;
  alt: string;
  brief: string;
  scene: 'road' | 'air' | 'warehouse' | 'movers' | 'parcels' | 'ops';
}

export const MEDIA: Record<MediaSlot, MediaItem> = {
  highway: {
    src: '',
    alt: 'Cargo truck on an Indian national highway at dusk',
    brief: 'Indian national highway, container truck in motion, blue hour, long lens.',
    scene: 'road',
  },
  truckFleet: {
    src: '',
    alt: 'Fleet of cargo trucks lined up at a logistics yard',
    brief: 'Row of clean trucks at a yard in early morning light, cool tones.',
    scene: 'road',
  },
  airCargo: {
    src: '',
    alt: 'Air cargo containers being loaded into an aircraft',
    brief: 'ULD containers on dollies beside a freighter at an Indian airport apron, night.',
    scene: 'air',
  },
  warehouse: {
    src: '',
    alt: 'Modern warehouse with high racks and organised pallets',
    brief: 'Clean warehouse aisle, high racking, blue/white lighting, a few workers in hi-vis.',
    scene: 'warehouse',
  },
  workers: {
    src: '',
    alt: 'Logistics team handling packages at a sorting hub',
    brief: 'Indian logistics staff in uniform scanning parcels, candid, natural light.',
    scene: 'ops',
  },
  parcels: {
    src: '',
    alt: 'Stacked delivery parcels ready for dispatch',
    brief: 'Neatly stacked labelled cartons on a pallet, shallow depth of field.',
    scene: 'parcels',
  },
  movingBoxes: {
    src: '',
    alt: 'Packed moving boxes in a home ready for relocation',
    brief: 'Bright Indian apartment interior with labelled moving boxes and wrapped furniture.',
    scene: 'movers',
  },
  operations: {
    src: '',
    alt: 'Logistics control room monitoring shipments on screens',
    brief: 'Operations desk with route maps on screens, calm and modern.',
    scene: 'ops',
  },
};
