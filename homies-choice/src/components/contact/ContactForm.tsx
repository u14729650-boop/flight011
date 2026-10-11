"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { validateEnquiry, type EnquiryErrors, type EnquiryInput } from "@/lib/validation";
import { contactMessage, whatsappUrl } from "@/lib/whatsapp";
import { submitEnquiryCopy } from "@/lib/enquiry-client";
import { WhatsAppIcon } from "@/components/ui/icons";

const empty: EnquiryInput = { name: "", phone: "", message: "" };

export function ContactForm() {
  const [values, setValues] = useState<EnquiryInput>(empty);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [sent, setSent] = useState(false);

  const set = (key: keyof EnquiryInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validateEnquiry(values);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as (keyof EnquiryInput)[])[0];
    if (firstInvalid) {
      document.getElementById(`enquiry-${firstInvalid}`)?.focus();
      return;
    }
    // Open WhatsApp synchronously (inside the click) so pop-up blockers allow it.
    window.open(whatsappUrl(contactMessage(values)), "_blank", "noopener,noreferrer");
    // Optionally keep a copy server-side when storage is configured; failures are non-blocking.
    submitEnquiryCopy(values);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="border border-line bg-white/60 p-8" role="status">
        <CheckCircle2 className="h-7 w-7 text-emerald" strokeWidth={1.2} aria-hidden="true" />
        <p className="display mt-5 text-3xl">Your message is ready in WhatsApp.</p>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Press send in WhatsApp to reach our team. If WhatsApp didn&rsquo;t open,{" "}
          <a href={whatsappUrl(contactMessage(values))} target="_blank" rel="noopener noreferrer" className="text-emerald underline underline-offset-4">
            open it here
          </a>
          .
        </p>
        <button type="button" onClick={() => { setValues(empty); setSent(false); }} className="mt-6 text-xs font-semibold tracking-[0.12em] uppercase hover:text-emerald">
          Write another message
        </button>
      </div>
    );
  }

  const fieldError = (key: keyof EnquiryInput) =>
    errors[key] ? (
      <p id={`enquiry-${key}-error`} className="mt-2 text-xs text-[#9b2c2c]">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-7" aria-label="Enquiry form">
      <div>
        <label htmlFor="enquiry-name" className="eyebrow text-[0.6rem] text-stone">Your name</label>
        <input
          id="enquiry-name"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={set("name")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "enquiry-name-error" : undefined}
          className="field"
          required
        />
        {fieldError("name")}
      </div>
      <div>
        <label htmlFor="enquiry-phone" className="eyebrow text-[0.6rem] text-stone">Contact number</label>
        <input
          id="enquiry-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+91"
          value={values.phone}
          onChange={set("phone")}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "enquiry-phone-error" : undefined}
          className="field"
          required
        />
        {fieldError("phone")}
      </div>
      <div>
        <label htmlFor="enquiry-message" className="eyebrow text-[0.6rem] text-stone">Message</label>
        <textarea
          id="enquiry-message"
          name="message"
          rows={4}
          placeholder="Which fragrance are you looking for?"
          value={values.message}
          onChange={set("message")}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "enquiry-message-error" : undefined}
          className="field resize-none"
          required
        />
        {fieldError("message")}
      </div>
      <div>
        <button type="submit" className="btn btn-dark w-full sm:w-auto">
          <WhatsAppIcon className="h-4 w-4" /> Send enquiry via WhatsApp
        </button>
        <p className="mt-3 text-xs text-stone">Your message opens in WhatsApp, ready for you to send.</p>
      </div>
    </form>
  );
}
