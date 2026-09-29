import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * The same map screen with responder tabs and tools switched on.
 * TODO(F6): require a signed-in responder. Until then this route is open to anyone.
 */
export default function DashboardPage() {
  return <AppShell role="responder" />;
}
