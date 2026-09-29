import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shell/PagePlaceholder";

export const metadata: Metadata = { title: "Report an incident" };

/** Standalone report form, for direct links and as a fallback for the sheet on the map (phase F5). */
export default function ReportPage() {
  return <PagePlaceholder name="report" phase="F5" />;
}
