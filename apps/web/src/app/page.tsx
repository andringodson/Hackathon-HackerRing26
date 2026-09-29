import { AppShell } from "@/components/shell/AppShell";

/** The public map screen. Deep links look like /?event={id} (wired up in phase F2). */
export default function HomePage() {
  return <AppShell role="public" />;
}
