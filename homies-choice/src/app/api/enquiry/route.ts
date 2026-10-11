import { NextResponse } from "next/server";
import { validateEnquiry } from "@/lib/validation";
import { db, supabaseConfigured } from "@/lib/server/supabase";

/**
 * Optional server-side copy of contact-form enquiries, stored in Supabase
 * (table `enquiries`) when configured. The enquiry itself always reaches the
 * shop through WhatsApp.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const errors = validateEnquiry(body);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });
  if (!supabaseConfigured()) return NextResponse.json({ ok: true, stored: false }, { status: 202 });

  const { error } = await db()
    .from("enquiries")
    .insert({ name: String(body.name).trim(), phone: String(body.phone).trim(), message: String(body.message).trim(), source: "website-contact-form" });
  if (error) {
    console.error("Enquiry insert failed", error.message);
    return NextResponse.json({ ok: false, stored: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true, stored: true }, { status: 201 });
}
