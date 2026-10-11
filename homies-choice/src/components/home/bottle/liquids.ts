/** Liquid colours the shop owner can pick for the hero bottle (Dashboard → Home page). */
export const LIQUIDS = {
  emerald: { label: "Emerald", color: 0x0d6b4f, glow: 0x03251b, stone: 0x0b6b4c, opacity: 0.86, swatch: "#0d6b4f" },
  amber: { label: "Amber oud", color: 0xb06a12, glow: 0x3a1c02, stone: 0x0b6b4c, opacity: 0.84, swatch: "#b06a12" },
  rose: { label: "Rose", color: 0xb8546f, glow: 0x3a0e19, stone: 0x0b6b4c, opacity: 0.8, swatch: "#b8546f" },
  noir: { label: "Noir", color: 0x16201c, glow: 0x020504, stone: 0x0b6b4c, opacity: 0.93, swatch: "#16201c" },
  clear: { label: "Crystal", color: 0xe8dcc0, glow: 0x2a2416, stone: 0x0b6b4c, opacity: 0.38, swatch: "#e8dcc0" },
} as const;

export type Liquid = keyof typeof LIQUIDS;
export const liquidNames = Object.keys(LIQUIDS) as Liquid[];
export const isLiquid = (v: unknown): v is Liquid => typeof v === "string" && v in LIQUIDS;
