"use client";

import { ExternalLink, ShieldCheck } from "lucide-react";
import { codSummary, MAX_TOKEN, upiLink, VPA_PATTERN } from "@/lib/store-settings";
import { QrCode } from "@/components/cart/UpiPay";
import { useAdminData } from "./AdminShell";
import { useSettingsDraft } from "./useSettingsDraft";
import { AdminPageHeader, FieldLabel, inputClass, Notice, Panel, SaveBar, Spinner, Toggle } from "./ui";

export function PaymentsForm() {
  const { status } = useAdminData();
  const { draft, patch, save, saving, message } = useSettingsDraft();
  if (!draft || !status) return message ? <Notice tone="error">{message.text}</Notice> : <Spinner />;
  const { cod, upi } = draft.checkout;
  const setCod = (v: Partial<typeof cod>) => patch("checkout", { cod: { ...cod, ...v } });
  const setUpi = (v: Partial<typeof upi>) => patch("checkout", { upi: { ...upi, ...v } });
  const vpaOk = VPA_PATTERN.test(upi.vpa.trim());
  const tokenNeedsUpi = cod.enabled && cod.tokenEnabled && !vpaOk;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(["checkout"], "Saved. Checkout now shows these payment options.");
      }}
      className="space-y-8"
    >
      <AdminPageHeader
        eyebrow="Checkout"
        title="Payments"
        actions={
          <a href="/checkout" target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark min-h-10 px-4 py-2">
            <ExternalLink className="h-4 w-4" /> View checkout
          </a>
        }
      />
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      <Notice>
        Customers choose a payment option at checkout and send their order on WhatsApp. UPI payments go straight to your UPI ID — this website never
        handles the money. Customers can type their UPI transaction ID, which you&rsquo;ll see under <strong>Orders</strong> to match payments.
      </Notice>

      <Panel title="Cash on delivery" description="Customers pay in cash when the order arrives.">
        <div className="space-y-6">
          <Toggle checked={cod.enabled} onChange={(enabled) => setCod({ enabled })} label="Offer cash on delivery" />
          <div className="space-y-5 rounded-2xl border border-line bg-white/60 p-4 sm:p-5">
            <Toggle
              checked={cod.tokenEnabled}
              disabled={!cod.enabled}
              onChange={(tokenEnabled) => setCod({ tokenEnabled })}
              label="Ask for an advance token"
              hint="A small amount paid by UPI to confirm the order; the rest is paid in cash on delivery. Helps avoid fake orders."
            />
            <div className="max-w-xs">
              <FieldLabel htmlFor="cod-token" hint={`₹1 – ₹${MAX_TOKEN.toLocaleString("en-IN")}`}>Token amount (₹)</FieldLabel>
              <input
                id="cod-token"
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_TOKEN}
                step={1}
                disabled={!cod.enabled || !cod.tokenEnabled}
                className={inputClass}
                value={cod.tokenAmount || ""}
                onChange={(e) => setCod({ tokenAmount: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                placeholder="e.g. 200"
              />
            </div>
            {tokenNeedsUpi && (
              <p className="text-xs leading-relaxed text-[#7a5410]">
                Add your UPI ID below so customers can pay the token straight away. Without it, they&rsquo;re told you&rsquo;ll share payment details on WhatsApp.
              </p>
            )}
          </div>
          <div>
            <FieldLabel htmlFor="cod-note" hint="optional, shown under the option">Note for customers</FieldLabel>
            <input id="cod-note" maxLength={200} className={inputClass} value={cod.note} disabled={!cod.enabled} onChange={(e) => setCod({ note: e.target.value })} />
          </div>
          {cod.enabled && (
            <div className="rounded-2xl bg-ivory/80 p-4 text-sm" aria-label="How customers see it">
              <p className="eyebrow text-[0.58rem] text-stone">Customers see</p>
              <p className="mt-2 font-medium">Cash on delivery</p>
              <p className="mt-0.5 text-xs text-stone">
                {[codSummary(cod.tokenEnabled && cod.tokenAmount > 0, cod.tokenAmount), cod.note].filter(Boolean).join(" ")}
              </p>
            </div>
          )}
        </div>
      </Panel>

      <Panel title="UPI" description="Customers pay with Google Pay, PhonePe, Paytm or any UPI app — by QR code or one tap on their phone.">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="space-y-5">
            <div>
              <FieldLabel htmlFor="upi-vpa" hint="name@bank">Your UPI ID</FieldLabel>
              <input
                id="upi-vpa"
                autoComplete="off"
                spellCheck={false}
                maxLength={300}
                className={inputClass}
                value={upi.vpa}
                aria-invalid={upi.vpa.trim() !== "" && !vpaOk}
                onChange={(e) => {
                  const vpa = e.target.value.replace(/\s/g, "");
                  // An unusable ID switches UPI off rather than leaving a broken option at checkout.
                  setUpi(VPA_PATTERN.test(vpa) ? { vpa } : { vpa, enabled: false });
                }}
                placeholder="e.g. yourshop@okaxis"
              />
              <p className="mt-1.5 text-xs text-stone">Copy it exactly from your UPI app. Payments go straight to this ID, so test it with a small amount first.</p>
            </div>
            <div>
              <FieldLabel htmlFor="upi-name" hint="shown in the customer's UPI app">Payee name</FieldLabel>
              <input id="upi-name" maxLength={50} className={inputClass} value={upi.payeeName} onChange={(e) => setUpi({ payeeName: e.target.value })} />
            </div>
            <div>
              <FieldLabel htmlFor="upi-note" hint="optional">Note for customers</FieldLabel>
              <input id="upi-note" maxLength={200} className={inputClass} value={upi.note} onChange={(e) => setUpi({ note: e.target.value })} placeholder="e.g. Delivery charges are confirmed on WhatsApp." />
            </div>
            <Toggle
              checked={upi.enabled}
              disabled={!vpaOk}
              onChange={(enabled) => setUpi({ enabled })}
              label="Offer UPI at checkout"
              hint={vpaOk ? "Customers can pay the full amount by UPI." : "Add a valid UPI ID to switch this on."}
            />
          </div>
          <div className="rounded-[1.5rem] border border-line bg-white/80 p-4 text-center">
            <p className="eyebrow text-[0.58rem] text-stone">Test QR</p>
            {vpaOk ? (
              <>
                <QrCode value={upiLink({ vpa: upi.vpa, payeeName: upi.payeeName })} label={`Test UPI QR for ${upi.vpa}`} className="mx-auto mt-3 h-40 w-40" />
                <p className="mt-3 text-xs text-stone">Scan it with your own phone to check it opens {upi.payeeName}.</p>
              </>
            ) : (
              <p className="mt-6 flex flex-col items-center gap-2 text-xs text-stone">
                <ShieldCheck className="h-6 w-6 text-gold-deep" strokeWidth={1.3} /> Your QR code appears here once you add a UPI ID.
              </p>
            )}
          </div>
        </div>
      </Panel>

      <SaveBar saving={saving} disabled={!status.database} label="Save payments" />
    </form>
  );
}
