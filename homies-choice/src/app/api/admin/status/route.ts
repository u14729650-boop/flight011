import { adminRoute, json } from "@/lib/server/admin-api";
import { fetchAllProducts } from "@/lib/server/catalogue-source";
import { supabaseConfigured } from "@/lib/server/supabase";

export const GET = adminRoute(async () => {
  const db = supabaseConfigured();
  const seeded = db ? (await fetchAllProducts()) !== null : false;
  return json({ database: db, seeded });
});
