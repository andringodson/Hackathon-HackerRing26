"use client";

import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { AGENT_PIPELINE } from "@/lib/agents";
import type { AgentStatus } from "@/types/agent";

/**
 * The agent pipeline: Ingest, Verify, Geo, Risk, Resource, Alert, Brief.
 * TODO(F6): replace with a React Flow graph (install `@xyflow/react`) with live node status
 * (idle, running, done, error), click-through to a node's inputs and outputs, and "Replay run".
 * The nodes here are static and always idle.
 */
export function AgentGraph({ status = "idle" }: { status?: AgentStatus }) {
  const t = useTranslations("agents");
  return (
    <ol aria-label={t("pipeline")} className="flex flex-wrap items-center gap-1.5">
      {AGENT_PIPELINE.map((agent, index) => (
        <Fragment key={agent}>
          {index > 0 && <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />}
          <li className="flex items-center gap-2 rounded-md border bg-elevated px-2.5 py-1.5 text-xs">
            <span aria-hidden className="size-2 rounded-full bg-subtle" />
            <span className="font-medium">{t(`names.${agent}`)}</span>
            {/* the status is text, not just a dot */}
            <span className="text-muted-foreground">{status === "idle" ? t("idle") : status}</span>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
