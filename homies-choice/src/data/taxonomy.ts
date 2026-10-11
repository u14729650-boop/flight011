export type Gender = "men" | "women" | "unisex";
export type Origin = "designer" | "arabic";

export const genderLabels: Record<Gender, string> = {
  men: "Men",
  women: "Women",
  unisex: "Unisex",
};

export const originLabels: Record<Origin, string> = {
  designer: "Designer",
  arabic: "Arabic",
};

export const fragranceFamilies = {
  amber: "Amber",
  spicy: "Spicy",
  gourmand: "Gourmand",
  woody: "Woody",
  fresh: "Fresh",
  aquatic: "Aquatic",
  aromatic: "Aromatic",
  floral: "Floral",
  leather: "Leather",
  oud: "Oud",
} as const;
export type FragranceFamily = keyof typeof fragranceFamilies;

export const moods = {
  "fresh-aquatic": {
    label: "Fresh & Aquatic",
    blurb: "Clean, airy and easy to wear — sea air, citrus and cool aromatics.",
  },
  "warm-spicy": {
    label: "Warm & Spicy",
    blurb: "Cinnamon, pepper and glowing amber for cooler evenings.",
  },
  "woody-smoky": {
    label: "Woody & Smoky",
    blurb: "Dry woods, resins and incense with quiet depth.",
  },
  "sweet-gourmand": {
    label: "Sweet & Gourmand",
    blurb: "Vanilla, praline and dates — comforting and addictive.",
  },
  "elegant-sophisticated": {
    label: "Elegant & Sophisticated",
    blurb: "Polished, refined scents for occasions that matter.",
  },
  "bold-intense": {
    label: "Bold & Intense",
    blurb: "Rich, long-lasting compositions with real presence.",
  },
} as const;
export type Mood = keyof typeof moods;
