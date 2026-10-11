import type { Metadata } from "next";
import { PaymentsForm } from "@/components/admin/PaymentsForm";

export const metadata: Metadata = { title: "Payments" };

export default function AdminPayments() {
  return <PaymentsForm />;
}
