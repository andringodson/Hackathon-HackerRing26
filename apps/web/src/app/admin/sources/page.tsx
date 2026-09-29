import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shell/PagePlaceholder";

export const metadata: Metadata = { title: "Data sources" };

/** Admin: data source configuration (phase F6). */
export default function AdminSourcesPage() {
  return <PagePlaceholder name="adminSources" phase="F6" />;
}
