import type { Mood } from "./taxonomy";

/**
 * EDITORIAL PHOTOGRAPHY
 * ---------------------
 * Each slot below is a campaign / editorial photograph. While `src` is null a
 * tonal, clearly abstract placeholder is shown (no fake bottles).
 *
 * To add a photograph: save it to /public/images/editorial/ (JPG or WebP,
 * ~2400px on the long edge) and set `src`, e.g. "/images/editorial/hero.jpg".
 * Use only photographs you own or are licensed to use commercially.
 */

export type Tone = "emerald" | "forest" | "charcoal" | "beige" | "ivory";

export interface MediaSlot {
  src: string | null;
  alt: string;
  tone: Tone;
}

type MoodKey = `mood-${Mood}`;
export type MediaKey =
  | "hero"
  | "discovery"
  | "collectionDesigner"
  | "collectionArabic"
  | "collectionMen"
  | "collectionWomen"
  | "contact"
  | MoodKey;

export const media: Record<MediaKey, MediaSlot> = {
  hero: { src: null, alt: "A perfume bottle lit against a deep emerald studio backdrop", tone: "emerald" },
  discovery: { src: null, alt: "Perfume bottles arranged in soft natural light", tone: "beige" },
  collectionDesigner: { src: null, alt: "Designer fragrance bottles", tone: "charcoal" },
  collectionArabic: { src: null, alt: "Arabic perfume bottles", tone: "emerald" },
  collectionMen: { src: null, alt: "Men's fragrances", tone: "forest" },
  collectionWomen: { src: null, alt: "Women's fragrances", tone: "beige" },
  contact: { src: null, alt: "The Homies Choice store", tone: "forest" },
  "mood-fresh-aquatic": { src: null, alt: "Fresh and aquatic fragrance mood", tone: "ivory" },
  "mood-warm-spicy": { src: null, alt: "Warm and spicy fragrance mood", tone: "beige" },
  "mood-woody-smoky": { src: null, alt: "Woody and smoky fragrance mood", tone: "charcoal" },
  "mood-sweet-gourmand": { src: null, alt: "Sweet and gourmand fragrance mood", tone: "beige" },
  "mood-elegant-sophisticated": { src: null, alt: "Elegant fragrance mood", tone: "emerald" },
  "mood-bold-intense": { src: null, alt: "Bold and intense fragrance mood", tone: "forest" },
};
