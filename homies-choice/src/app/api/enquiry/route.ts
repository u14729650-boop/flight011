import { NextResponse } from "next/server";
import { validateEnquiry } from "@/lib/validation";

/**
 * Optional server-side copy of contact-form enquiries.
 * Stores into Supabase (table `enquiries`, see /supabase/schema.sql) when
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set on the server.
 * Otherwise it validates and acknowledges without storing — the enquiry itself
 * always reaches the shop through WhatsApp.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const errors = validateEnquiry(body);
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: true, stored: false }, { status: 202 });
  }

  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/enquiries`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      message: String(body.message).trim(),
      source: "website-contact-form",
    }),
  });

  if (!res.ok) {
    console.error("Enquiry insert failed", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ ok: false, stored: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true, stored: true }, { status: 201 });
}
