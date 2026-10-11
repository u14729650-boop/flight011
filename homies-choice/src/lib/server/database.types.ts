/**
 * Supabase table types for the HOMIES CHOICE schema (supabase/schema.sql).
 * Regenerate with `npx supabase gen types typescript` if the schema changes.
 */
import type { Product } from "@/data/products";
import type { BannerImage, BannerPlacement, BannerTheme } from "@/data/banners";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProductRow = {
  slug: string;
  category: Product["category"];
  brand: string;
  name: string;
  concentration: string | null;
  gender: Product["gender"];
  origin: Product["origin"];
  families: string[];
  moods: string[];
  description: string;
  notes: Product["notes"] | null;
  specs: Product["specs"];
  images: Product["images"];
  variants: Product["variants"];
  bestseller: boolean;
  is_published: boolean;
  pending_verification: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type EnquiryRow = {
  id: string;
  name: string;
  phone: string;
  message: string;
  source: string | null;
  handled: boolean;
  created_at: string;
};

export type OrderRow = {
  id: string;
  ref: string;
  status: "new" | "confirmed" | "paid" | "shipped" | "delivered" | "cancelled";
  customer_name: string;
  area: string;
  note: string;
  payment_method: "cod" | "upi" | "whatsapp";
  payment_ref: string;
  token_amount: number | null;
  subtotal: number | null;
  unpriced_items: number;
  items: Json;
  created_at: string;
  updated_at: string;
};

export type SettingRow = {
  key: string;
  value: Json;
  updated_at: string;
};

export type BannerRow = {
  id: string;
  placement: BannerPlacement;
  title: string;
  subtitle: string | null;
  eyebrow: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image: BannerImage | null;
  mobile_image: BannerImage | null;
  theme: BannerTheme;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      products: Table<ProductRow, "slug" | "category" | "brand" | "name" | "gender">;
      enquiries: Table<EnquiryRow, "name" | "phone" | "message">;
      orders: Table<OrderRow, "ref" | "payment_method" | "items">;
      settings: Table<SettingRow, "key" | "value">;
      banners: Table<BannerRow, "placement" | "title">;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
