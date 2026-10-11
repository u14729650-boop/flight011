import type { EnquiryInput } from "@/lib/validation";
import { updateStore } from "./demo-store";

export function submitEnquiryCopy(values: EnquiryInput): void {
  updateStore((s) => ({
    ...s,
    enquiries: [
      { id: crypto.randomUUID(), name: values.name.trim(), phone: values.phone.trim(), message: values.message.trim(), source: "website-contact-form", handled: false, created_at: new Date().toISOString() },
      ...s.enquiries,
    ],
  }));
}
