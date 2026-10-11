import { isOrderStatus } from "@/lib/orders";
import { adminRoute, json } from "@/lib/server/admin-api";
import { db, unwrap } from "@/lib/server/supabase";

export const PATCH = adminRoute(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Not found" }, 404);
    const body = (await req.json().catch(() => ({}))) as { status?: unknown };
    if (!isOrderStatus(body.status)) return json({ error: "Unknown status." }, 422);
    unwrap(await db().from("orders").update({ status: body.status }).eq("id", id));
    return json({ ok: true });
  },
  { write: true, needsDb: true },
);
