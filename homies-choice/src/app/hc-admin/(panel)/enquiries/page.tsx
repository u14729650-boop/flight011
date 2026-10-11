import type { Metadata } from "next";
import { EnquiriesTable } from "@/components/admin/EnquiriesTable";

export const metadata: Metadata = { title: "Enquiries" };

export default function AdminEnquiries() {
  return <EnquiriesTable />;
}
