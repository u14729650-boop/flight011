/** Shapes shared by the admin UI and its API client. */
import type { StoreSettings } from "./store-settings";
import type { Order } from "./orders";

export interface AdminStatus {
  database: boolean;
  seeded: boolean;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  message: string;
  source: string | null;
  handled: boolean;
  created_at: string;
}

export type AdminSettings = StoreSettings;
export type { Order };
