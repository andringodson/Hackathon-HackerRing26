"use client";

import { useTranslations } from "next-intl";

/**
 * TODO(F6): live agent log: step, agent, latency and status, streamed over the WebSocket, with
 * auto-scroll that pauses while the user scrolls up. Uses types/agent.ts (AgentRun).
 */
export function LogStream() {
  const t = useTranslations("agents");
  return (
    <section aria-label={t("log")} className="min-h-0 flex-1 overflow-y-auto">
      <h3 className="mb-1 text-xs font-medium text-muted-foreground">{t("log")}</h3>
      <p className="font-mono text-xs text-muted-foreground">{t("notBuilt")}</p>
    </section>
  );
}
