import type { Metadata } from "next";
import { HomePageForm } from "@/components/admin/HomePageForm";

export const metadata: Metadata = { title: "Home page" };

export default function AdminHomePage() {
  return <HomePageForm />;
}
