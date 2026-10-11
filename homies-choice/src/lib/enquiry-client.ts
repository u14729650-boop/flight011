import type { EnquiryInput } from "./validation";

/** Keeps a server-side copy of a contact-form enquiry when storage is configured. Never blocks the user. */
export function submitEnquiryCopy(values: EnquiryInput): void {
  fetch("/api/enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
    keepalive: true,
  }).catch(() => {});
}
