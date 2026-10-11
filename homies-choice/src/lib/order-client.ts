import type { OrderInput } from "./orders";

/** Keeps a copy of a checkout order for the dashboard. Never blocks the customer. (The preview swaps this out.) */
export function submitOrderCopy(input: OrderInput): void {
  fetch("/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => {});
}
