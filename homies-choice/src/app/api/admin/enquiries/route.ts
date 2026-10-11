import { adminRoute, json } from "@/lib/server/admin-api";
import { rest, supabaseConfigured } from "@/lib/server/supabase";

export const GET = adminRoute(async () => {
  if (!supabaseConfigured()) return json({ enquiries: [], database: false });
  const enquiries = await rest("enquiries?select=*&order=created_at.desc&limit=200", { cache: "no-store" });
  return json({ enquiries, database: true });
});
