import type { Metadata } from "next";
import { OrdersTable } from "@/components/admin/OrdersTable";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrders() {
  return <OrdersTable />;
}
