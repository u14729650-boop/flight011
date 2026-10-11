import { adminRoute, json } from "@/lib/server/admin-api";
import { db, supabaseConfigured, unwrap } from "@/lib/server/supabase";

export const GET = adminRoute(async () => {
  if (!supabaseConfigured()) return json({ enquiries: [], database: false });
  const enquiries = unwrap(await db().from("enquiries").select("id,name,phone,message,source,handled,created_at").order("created_at", { ascending: false }).limit(200));
  return json({ enquiries, database: true });
});
