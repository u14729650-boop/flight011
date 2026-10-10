import type { Gender, Mood, Origin } from "./taxonomy";
import { moods } from "./taxonomy";
import type { MediaKey } from "./media";

export interface CollectionScope {
  gender?: Gender;
  origin?: Origin;
  bestseller?: boolean;
  mood?: Mood;
}

export interface Collection {
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  scope: CollectionScope;
  media: MediaKey;
}

const baseCollections: Collection[] = [
  {
    slug: "men",
    title: "Men's Fragrances",
    eyebrow: "The men's edit",
    intro: "From fresh daily signatures to warm, spiced evening scents — designer and Arabic fragrances for men.",
    metaTitle: "Men's Perfumes in Ahmedabad",
    metaDescription:
      "Shop men's fragrances in Ahmedabad at Homies Choice — designer perfumes and Arabic attars-inspired scents, with easy WhatsApp ordering.",
    scope: { gender: "men" },
    media: "collectionMen",
  },
  {
    slug: "women",
    title: "Women's Fragrances",
    eyebrow: "The women's edit",
    intro: "Elegant florals, soft musks and rich ambers chosen for women who wear fragrance as a signature.",
    metaTitle: "Women's Perfumes in Ahmedabad",
    metaDescription:
      "Discover women's fragrances at Homies Choice, Ahmedabad — designer and Arabic perfumes with personal guidance on WhatsApp.",
    scope: { gender: "women" },
    media: "collectionWomen",
  },
  {
    slug: "unisex",
    title: "Unisex Fragrances",
    eyebrow: "Made to be shared",
    intro: "Compositions that belong to whoever wears them best.",
    metaTitle: "Unisex Perfumes in Ahmedabad",
    metaDescription: "Unisex fragrances from designer and Arabic perfume houses, available at Homies Choice in Ahmedabad.",
    scope: { gender: "unisex" },
    media: "discovery",
  },
  {
    slug: "arabic",
    title: "Arabic Perfumes",
    eyebrow: "From the houses of the Gulf",
    intro: "Rich, long-lasting compositions from Lattafa, Afnan, Rasasi and more of the region's most loved perfume houses.",
    metaTitle: "Arabic Perfumes in Ahmedabad",
    metaDescription:
      "Shop Arabic perfumes in Ahmedabad — Lattafa, Afnan, Rasasi, French Avenue and more at Homies Choice. Order easily on WhatsApp.",
    scope: { origin: "arabic" },
    media: "collectionArabic",
  },
  {
    slug: "designer",
    title: "Designer Fragrances",
    eyebrow: "Iconic houses",
    intro: "Modern classics and new favourites from the world's best-known fashion and fragrance houses.",
    metaTitle: "Designer Fragrances in Ahmedabad",
    metaDescription: "Designer fragrances in Ahmedabad at Homies Choice — iconic international perfumes with easy WhatsApp ordering.",
    scope: { origin: "designer" },
    media: "collectionDesigner",
  },
  {
    slug: "bestsellers",
    title: "Bestsellers",
    eyebrow: "The fragrances everyone's talking about",
    intro: "Iconic scents and modern favourites — the bottles our customers ask for most.",
    metaTitle: "Bestselling Perfumes",
    metaDescription: "The most-requested perfumes at Homies Choice, Ahmedabad — Lattafa Khamrah, Afnan 9 PM, Rasasi Hawas and more.",
    scope: { bestseller: true },
    media: "hero",
  },
];

const moodCollections: Collection[] = (Object.keys(moods) as Mood[]).map((mood) => ({
  slug: mood,
  title: moods[mood].label,
  eyebrow: "Shop by mood",
  intro: moods[mood].blurb,
  metaTitle: `${moods[mood].label} Perfumes`,
  metaDescription: `${moods[mood].label} fragrances at Homies Choice, Ahmedabad. ${moods[mood].blurb}`,
  scope: { mood },
  media: `mood-${mood}` as MediaKey,
}));

export const collections: Collection[] = [...baseCollections, ...moodCollections];

export function getCollection(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}
