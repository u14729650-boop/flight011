import { parseBannerInput } from "@/lib/banner-schema";
import { adminRoute, json, refreshStorefront } from "@/lib/server/admin-api";
import { bannerToRow, rowToBanner } from "@/lib/server/banners";
import { db, unwrap } from "@/lib/server/supabase";

type Ctx = { params: Promise<{ id: string }> };
const isUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

export const PUT = adminRoute(
  async (req: Request, { params }: Ctx) => {
    const { id } = await params;
    if (!isUuid(id)) return json({ error: "Banner not found." }, 404);
    const { banner, errors } = parseBannerInput(await req.json().catch(() => null));
    if (Object.keys(errors).length) return json({ error: "Please fix the highlighted fields.", errors }, 422);
    const row = unwrap(await db().from("banners").update(bannerToRow(banner)).eq("id", id).select("*").maybeSingle());
    if (!row) return json({ error: "Banner not found." }, 404);
    refreshStorefront("banners");
    return json({ banner: rowToBanner(row) });
  },
  { write: true, needsDb: true },
);

export const DELETE = adminRoute(
  async (_req: Request, { params }: Ctx) => {
    const { id } = await params;
    if (!isUuid(id)) return json({ error: "Banner not found." }, 404);
    unwrap(await db().from("banners").delete().eq("id", id));
    refreshStorefront("banners");
    return json({ ok: true });
  },
  { write: true, needsDb: true },
);
