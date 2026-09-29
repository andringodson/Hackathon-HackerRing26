"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { AgentGraph } from "@/components/agents/AgentGraph";
import { LogStream } from "@/components/agents/LogStream";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";

/**
 * Bottom drawer for responders (design doc 3.3): a monitoring aid that must not compete with the
 * map, so it takes 30% of the height and sits between the sidebars. Opens with the Agents button or
 * the "A" key. Load it with next/dynamic once it grows (React Flow is heavy).
 */
export function AgentDrawer() {
  const t = useTranslations("agents");
  const open = useUiStore((s) => s.agentDrawerOpen);
  const setOpen = useUiStore((s) => s.setAgentDrawerOpen);

  return (
    <section
      aria-label={t("title")}
      inert={!open}
      // h-[30vh] matches DRAWER_HEIGHT_RATIO in lib/layout.ts, which sets the map padding.
      className={cn(
        "fixed right-[var(--inset-right)] bottom-0 left-[var(--inset-left)] z-20 flex h-[30vh] flex-col border-t bg-panel",
        "transition-transform duration-200 ease-out",
        open ? "translate-y-0 shadow-[var(--shadow-float)]" : "translate-y-full",
        "max-md:hidden",
      )}
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b pr-2 pl-4">
        <h2 className="text-sm font-semibold">{t("title")}</h2>
        <IconButton label={t("close")} icon={X} tooltipSide="left" onClick={() => setOpen(false)} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <AgentGraph />
        <LogStream />
      </div>
    </section>
  );
}
