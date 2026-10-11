"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminApiError, type Enquiry } from "@/lib/admin-client";
import { cx } from "@/lib/format";
import { WhatsAppIcon } from "@/components/ui/icons";
import { AdminPageHeader, Badge, Notice, Spinner } from "./ui";

function replyLink(e: Enquiry) {
  const digits = e.phone.replace(/\D/g, "");
  const number = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(`Hello ${e.name}, thank you for contacting Homies Choice.`)}`;
}

export function EnquiriesTable() {
  const [data, setData] = useState<{ enquiries: Enquiry[]; database: boolean } | null>(null);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.listEnquiries().then(setData).catch((e) => setError(e instanceof AdminApiError ? e.message : "Couldn't load enquiries."));
  }, []);

  const toggle = async (e: Enquiry) => {
    try {
      await adminApi.setEnquiryHandled(e.id, !e.handled);
      setData((d) => d && { ...d, enquiries: d.enquiries.map((x) => (x.id === e.id ? { ...x, handled: !x.handled } : x)) });
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Couldn't update.");
    }
  };

  const rows = (data?.enquiries ?? []).filter((e) => filter === "all" || !e.handled);

  return (
    <div className="space-y-8">
      <AdminPageHeader eyebrow="Customers" title="Enquiries" />
      {error && <Notice tone="error">{error}</Notice>}
      {!data ? (
        <Spinner />
      ) : !data.database ? (
        <Notice>
          Enquiries from the contact form always open in WhatsApp. To also keep a copy here, connect Supabase (README → “Admin panel”).
        </Notice>
      ) : (
        <>
          <div className="flex gap-2" role="tablist" aria-label="Filter enquiries">
            {(["open", "all"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cx("border px-4 py-2 text-xs font-semibold tracking-[0.1em] uppercase", filter === f ? "border-emerald bg-emerald text-ivory" : "border-line bg-white text-stone")}
              >
                {f === "open" ? "To reply" : "All"}
              </button>
            ))}
          </div>
          {rows.length === 0 ? (
            <p className="border border-dashed border-line px-6 py-14 text-center text-sm text-stone">
              {filter === "open" ? "You're all caught up." : "No enquiries yet."}
            </p>
          ) : (
            <ul className="space-y-3">
              {rows.map((e) => (
                <li key={e.id} className={cx("border border-line bg-white/80 p-5", e.handled && "opacity-70")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-serif text-xl leading-tight">{e.name}</p>
                      <p className="text-sm text-stone tabular-nums">{e.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.handled ? <Badge tone="good">Replied</Badge> : <Badge tone="warn">To reply</Badge>}
                      <time className="text-xs text-stone" dateTime={e.created_at}>
                        {new Date(e.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                      </time>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{e.message}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold tracking-[0.1em] uppercase">
                    <a href={replyLink(e)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald hover:text-gold-deep">
                      <WhatsAppIcon className="h-3.5 w-3.5" /> Reply on WhatsApp
                    </a>
                    <button type="button" onClick={() => toggle(e)} className="text-stone hover:text-charcoal">
                      {e.handled ? "Mark as to reply" : "Mark as replied"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

