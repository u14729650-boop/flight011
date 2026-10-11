import { adminRoute, json } from "@/lib/server/admin-api";
import { uploadObject } from "@/lib/server/supabase";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const MAX_BYTES = 6 * 1024 * 1024;

export const POST = adminRoute(
  async (req) => {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return json({ error: "Choose an image to upload." }, 400);
    const ext = TYPES[file.type];
    if (!ext) return json({ error: "Use a JPG, PNG, WebP or AVIF image." }, 415);
    if (file.size > MAX_BYTES) return json({ error: "Images must be 6 MB or smaller." }, 413);
    const folder = String(form?.get("folder") ?? "misc").replace(/[^a-z0-9-]/gi, "").slice(0, 80) || "misc";
    const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const url = await uploadObject(path, await file.arrayBuffer(), file.type);
    return json({ src: url }, 201);
  },
  { write: true, needsDb: true },
);
