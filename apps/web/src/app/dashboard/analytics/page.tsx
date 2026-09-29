import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shell/PagePlaceholder";

export const metadata: Metadata = { title: "Analytics" };

/** Charts and history for analysts. Charts belong here, not on the map screen (phase F6). */
export default function AnalyticsPage() {
  return <PagePlaceholder name="analytics" phase="F6" />;
}
