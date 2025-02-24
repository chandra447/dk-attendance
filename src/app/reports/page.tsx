import { Metadata } from "next";
import { ReportsPage } from "@/components/reports/reports-page";

export const metadata: Metadata = {
  title: "Reports | DK Attendance",
  description: "View salary advance reports",
};

export default function Page() {
  return <ReportsPage />;
}

