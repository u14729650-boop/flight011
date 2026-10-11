"use client";

import { useMemo } from "react";
import { encode } from "uqr";
import { Smartphone } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { upiLink } from "@/lib/store-settings";
import { CopyButton } from "@/components/ui/CopyButton";

/** A crisp QR code drawn as one SVG path (no images, no external service). */
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const { path, size } = useMemo(() => {
    const qr = encode(value, { ecc: "M", border: 2 });
    let d = "";
    qr.data.forEach((row, y) => row.forEach((dark, x) => dark && (d += `M${x} ${y}h1v1h-1z`)));
    return { path: d, size: qr.size };
  }, [value]);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#fff" />
      <path d={path} fill="#151713" />
    </svg>
  );
}

/**
 * Pay by UPI: a QR code to scan, a button that opens any UPI app on a phone, and
 * the UPI ID to copy. The customer then types the transaction reference so our
 * team can match the payment (nothing is charged by this website).
 */
export function UpiPay({
  vpa,
  payeeName,
  amount,
  note,
  heading,
  reference,
  onReferenceChange,
}: {
  vpa: string;
  payeeName: string;
  /** Rupees; null lets the customer enter the amount in their UPI app. */
  amount: number | null;
  note: string;
  heading: string;
  reference: string;
  onReferenceChange: (v: string) => void;
}) {
  const link = upiLink({ vpa, payeeName, amount, note });
  return (
    <div className="rounded-[1.5rem] border border-line bg-white/80 p-4 sm:p-5" data-testid="upi-pay">
      <p className="eyebrow text-[0.6rem] text-gold-deep">{heading}</p>
      <p className="mt-2 font-serif text-3xl leading-none tabular-nums">{amount != null ? formatPrice(amount) : "Amount on confirmation"}</p>
      <p className="mt-1 text-xs text-stone">to {payeeName}</p>

      <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
        <QrCode value={link} label={`UPI QR code to pay ${payeeName}`} className="h-28 w-28 rounded-xl border border-line sm:h-32 sm:w-32" />
        <div className="min-w-0 space-y-2.5 text-sm">
          <p className="text-xs leading-relaxed text-stone">Scan with Google Pay, PhonePe, Paytm or any UPI app.</p>
          <a href={link} className="btn btn-dark min-h-10 w-full gap-2 px-3 py-2 text-[0.65rem]" data-testid="upi-app-link">
            <Smartphone className="hidden h-4 w-4 sm:block" /> Open UPI app
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ivory/80 px-3 py-2.5">
        <span className="min-w-0 text-sm">
          <span className="text-stone">UPI ID </span>
          <span className="font-medium break-all" data-testid="upi-id">{vpa}</span>
        </span>
        <CopyButton value={vpa} label="Copy" className="rounded-full border border-line px-3 py-1 text-charcoal hover:border-charcoal" />
      </div>

      <label htmlFor="upi-ref" className="eyebrow mt-5 block text-[0.6rem] text-stone">
        UPI transaction ID <span className="font-normal tracking-normal normal-case">(after paying, optional)</span>
      </label>
      <input
        id="upi-ref"
        inputMode="text"
        autoComplete="off"
        maxLength={40}
        value={reference}
        onChange={(e) => onReferenceChange(e.target.value.replace(/[^A-Za-z0-9-]/g, ""))}
        placeholder="e.g. 412345678901"
        className="field"
      />
      <p className="mt-2 text-xs leading-relaxed text-stone">Our team matches your payment and confirms on WhatsApp.</p>
    </div>
  );
}
