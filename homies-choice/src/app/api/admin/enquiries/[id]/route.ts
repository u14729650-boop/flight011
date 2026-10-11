import { adminRoute, json } from "@/lib/server/admin-api";
import { rest } from "@/lib/server/supabase";

export const PATCH = adminRoute(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Not found" }, 404);
    const body = (await req.json().catch(() => ({}))) as { handled?: unknown };
    await rest(`enquiries?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ handled: Boolean(body.handled) }), headers: { Prefer: "return=minimal" } });
    return json({ ok: true });
  },
  { write: true, needsDb: true },
);
