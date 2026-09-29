import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shell/PagePlaceholder";

export const metadata: Metadata = { title: "Settings" };

/** Admin: platform settings (phase F6). */
export default function AdminSettingsPage() {
  return <PagePlaceholder name="adminSettings" phase="F6" />;
}
