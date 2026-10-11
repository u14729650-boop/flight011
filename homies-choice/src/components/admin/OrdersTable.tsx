"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { adminApi, AdminApiError, type Order } from "@/lib/admin-client";
import { cx, formatPrice } from "@/lib/format";
import { orderStatuses, paymentLabels, type OrderStatus } from "@/lib/orders";
import { useAdminData } from "./AdminShell";
import { AdminPageHeader, Badge, Notice, Spinner } from "./ui";

const statusTone: Record<OrderStatus, "neutral" | "good" | "warn" | "bad" | "gold"> = {
  new: "gold",
  confirmed: "warn",
  paid: "good",
  shipped: "good",
  delivered: "neutral",
  cancelled: "bad",
};

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function OrdersTable() {
  const { status } = useAdminData();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [database, setDatabase] = useState(true);
  const [filter, setFilter] = useState<"open" | OrderStatus | "all">("open");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await adminApi.listOrders();
      setOrders(r.orders);
      setDatabase(r.database);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "Couldn't load orders.");
      setOrders([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(
    () => (orders ?? []).filter((o) => (filter === "all" ? true : filter === "open" ? !["delivered", "cancelled"].includes(o.status) : o.status === filter)),
    [orders, filter],
  );

  const setStatus = async (o: Order, next: OrderStatus) => {
    const previous = o.status;
    setOrders((list) => list && list.map((x) => (x.id === o.id ? { ...x, status: next } : x)));
    setError(null);
    try {
      await adminApi.setOrderStatus(o.id, next);
    } catch (e) {
      setOrders((list) => list && list.map((x) => (x.id === o.id ? { ...x, status: previous } : x)));
      setError(e instanceof AdminApiError ? e.message : "Couldn't update the order.");
    }
  };

  const tabs: { value: typeof filter; label: string }[] = [
    { value: "open", label: "Open" },
    ...orderStatuses.map((s) => ({ value: s.value, label: s.label })),
    { value: "all", label: "All" },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader eyebrow="Sales" title="Orders" />
      {error && <Notice tone="error">{error}</Notice>}
      {!database && status && !status.database && (
        <Notice>Orders are stored once a database is connected (README → “Admin panel”). They always reach you on WhatsApp.</Notice>
      )}
      <p className="text-sm text-stone">
        Every order sent from the checkout appears here with its reference (e.g. <span className="font-medium text-charcoal">HC-7K4Q2M</span>) — the same one
        the customer sends you on WhatsApp. Match UPI payments by their transaction ID.
      </p>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter orders">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={filter === t.value}
            onClick={() => setFilter(t.value)}
            className={cx(
              "shrink-0 rounded-full px-4 py-2 text-xs font-medium tracking-[0.1em] uppercase transition-colors",
              filter === t.value ? "bg-emerald text-ivory" : "border border-line bg-white/70 text-stone hover:text-charcoal",
            )}
          >
            {t.label}
            {orders && t.value !== "all" && t.value !== "open" && <span className="ml-1.5 opacity-70">{orders.filter((o) => o.status === t.value).length}</span>}
          </button>
        ))}
      </div>

      {!orders ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <p className="rounded-[1.5rem] border border-dashed border-line px-6 py-14 text-center text-sm text-stone">
          {orders.length === 0 ? "No orders yet. Orders placed from the checkout page will appear here." : "No orders in this view."}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((o) => {
            const label = orderStatuses.find((s) => s.value === o.status)?.label ?? o.status;
            const total = o.subtotal != null ? formatPrice(o.subtotal) + (o.unpricedItems ? ` + ${o.unpricedItems} on request` : "") : "Price on request";
            return (
              <li key={o.id} className="rounded-[1.5rem] border border-white/80 bg-white/75 p-4 shadow-[0_20px_50px_-35px_rgba(6,59,46,0.35)] backdrop-blur-xl sm:p-5" data-testid="order-row">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-serif text-xl tabular-nums">{o.ref}</span>
                      <Badge tone={statusTone[o.status]}>{label}</Badge>
                    </p>
                    <p className="mt-1 text-xs text-stone">
                      <time dateTime={o.createdAt}>{when(o.createdAt)}</time>
                      {o.name && <> · {o.name}</>}
                      {o.area && <> · {o.area}</>}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-stone">
                    <span className="sr-only">Status of {o.ref}</span>
                    <select
                      value={o.status}
                      onChange={(e) => setStatus(o, e.target.value as OrderStatus)}
                      disabled={!database}
                      className="h-10 rounded-full border border-line bg-white px-3 text-sm text-charcoal"
                    >
                      {orderStatuses.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <ul className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
                  {o.items.map((i) => (
                    <li key={`${i.slug}-${i.variantId}`} className="flex justify-between gap-3">
                      <span className="min-w-0">
                        <Link href={`/products/${i.slug}`} target="_blank" className="hover:text-emerald">{i.title}</Link>
                        <span className="text-stone"> · {i.option} × {i.qty}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-stone">{i.unitPrice != null ? formatPrice(i.unitPrice * i.qty) : "on request"}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pt-3 text-sm">
                  <p>
                    <span className="text-stone">Total </span>
                    <span className="font-medium tabular-nums">{total}</span>
                  </p>
                  <p className="flex flex-wrap items-center gap-2">
                    <Badge tone={o.payment === "upi" ? "good" : "neutral"}>{paymentLabels[o.payment]}</Badge>
                    {o.tokenAmount != null && <span className="text-xs text-stone">Token {formatPrice(o.tokenAmount)}</span>}
                    {o.paymentRef ? (
                      <span className="text-xs">
                        UPI ref <span className="font-medium tabular-nums">{o.paymentRef}</span>
                      </span>
                    ) : (
                      (o.payment === "upi" || o.tokenAmount != null) && <span className="text-xs text-[#7a5410]">No UPI ref yet</span>
                    )}
                  </p>
                </div>
                {o.note && <p className="mt-3 rounded-xl bg-ivory/80 px-3 py-2 text-sm text-charcoal/80">“{o.note}”</p>}
              </li>
            );
          })}
        </ul>
      )}
      <p className="flex items-center gap-1.5 text-xs text-stone">
        <ExternalLink className="h-3.5 w-3.5" /> Product names open the shop page in a new tab.
      </p>
    </div>
  );
}
