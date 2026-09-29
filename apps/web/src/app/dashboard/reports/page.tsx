import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shell/PagePlaceholder";

export const metadata: Metadata = { title: "Reports" };

/** SITREP list and PDFs (phase F6). */
export default function ReportsPage() {
  return <PagePlaceholder name="reports" phase="F6" />;
}
