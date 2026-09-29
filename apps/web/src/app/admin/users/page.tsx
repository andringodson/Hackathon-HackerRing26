import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shell/PagePlaceholder";

export const metadata: Metadata = { title: "Users" };

/** Admin: user management (phase F6). */
export default function AdminUsersPage() {
  return <PagePlaceholder name="adminUsers" phase="F6" />;
}
