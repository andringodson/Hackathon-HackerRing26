/*
 * Agent pipeline types for the responder Agent drawer and Trace tab (phase F6). Hand-written from
 * the project brief; replace with OpenAPI-generated types once the backend exists.
 */

export type AgentName = "ingest" | "verify" | "geo" | "risk" | "resource" | "alert" | "brief";

export type AgentStatus = "idle" | "running" | "done" | "error";

export interface AgentRun {
  id: string;
  eventId: string;
  agent: AgentName;
  status: AgentStatus;
  startedAt: string;
  durationMs?: number;
  input?: unknown;
  output?: unknown;
  error?: string;
}
