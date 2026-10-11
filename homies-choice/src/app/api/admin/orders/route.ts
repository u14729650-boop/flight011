import type { Order, OrderItem } from "@/lib/orders";
import { adminRoute, json } from "@/lib/server/admin-api";
import type { OrderRow } from "@/lib/server/database.types";
import { db, supabaseConfigured, unwrap } from "@/lib/server/supabase";

export function rowToOrder(r: OrderRow): Order {
  return {
    id: r.id,
    ref: r.ref,
    status: r.status,
    name: r.customer_name,
    area: r.area,
    note: r.note,
    payment: r.payment_method,
    paymentRef: r.payment_ref,
    tokenAmount: r.token_amount,
    subtotal: r.subtotal,
    unpricedItems: r.unpriced_items,
    items: Array.isArray(r.items) ? (r.items as unknown as OrderItem[]) : [],
    createdAt: r.created_at,
  };
}

export const GET = adminRoute(async () => {
  if (!supabaseConfigured()) return json({ orders: [], database: false });
  const rows = unwrap(await db().from("orders").select("*").order("created_at", { ascending: false }).limit(300));
  return json({ orders: (rows ?? []).map(rowToOrder), database: true });
});
