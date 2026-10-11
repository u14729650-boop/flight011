export interface EnquiryInput {
  name: string;
  phone: string;
  message: string;
}

export type EnquiryErrors = Partial<Record<keyof EnquiryInput, string>>;

export function validateEnquiry(input: Partial<Record<keyof EnquiryInput, unknown>>): EnquiryErrors {
  const errors: EnquiryErrors = {};
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (name.length < 2) errors.name = "Please enter your name.";
  else if (name.length > 80) errors.name = "Please keep your name under 80 characters.";

  const digits = phone.replace(/\D/g, "");
  if (!phone) errors.phone = "Please enter a contact number.";
  else if (!/^\+?[\d\s()-]+$/.test(phone) || digits.length < 10 || digits.length > 15)
    errors.phone = "Please enter a valid phone number, e.g. +91 98765 43210.";

  if (message.length < 10) errors.message = "Please tell us a little more (at least 10 characters).";
  else if (message.length > 1000) errors.message = "Please keep your message under 1,000 characters.";

  return errors;
}
