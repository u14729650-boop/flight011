/** Shapes shared by the admin UI and its API client. */
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

export interface AdminSettings {
  announcement: { enabled: boolean; text: string; href: string | null };
}
