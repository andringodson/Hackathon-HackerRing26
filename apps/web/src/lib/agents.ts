import type { AgentName } from "@/types/agent";

/** Agent order in the pipeline (design doc 6.2 / project brief 6.2). Drives the Agent drawer graph. */
export const AGENT_PIPELINE: readonly AgentName[] = [
  "ingest",
  "verify",
  "geo",
  "risk",
  "resource",
  "alert",
  "brief",
];
