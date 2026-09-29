import type { Bbox } from "@/lib/geo";
import type { HazardType } from "@/lib/hazards";
import type { Severity } from "@/lib/severity";
import type { TimeRange } from "@/lib/time-range";

/*
 * Hand-written to match the data model in the project brief (section 6.5). Replace with types
 * generated from the backend's OpenAPI schema once the API exists.
 *
 * Named DisasterEvent, not Event, so it never shadows the DOM's global Event.
 */

export interface EventSource {
  id: string;
  name: string;
  kind: "official" | "news" | "social" | "citizen" | "sensor";
  /** 0 to 1: how much we trust this source in general. */
  reliability: number;
  /** 0 to 1: how well this source agrees with the others on this event. */
  agreement: number;
  url?: string;
  reportedAt: string;
  /** The feed has stopped updating. Shown as an amber dot. */
  stale?: boolean;
}

export interface EventImpact {
  peopleExposed?: number;
  hospitalsInZone?: number;
  sheltersNearby?: number;
}

export interface DisasterEvent {
  id: string;
  type: HazardType;
  title: string;
  place: string;
  severity: Severity;
  /** 0 to 1. Below 0.6 the pipeline drops or watch-lists an event. */
  confidence: number;
  confidenceReasoning?: string;
  sourceCount: number;
  /** Unverified events are visible to responders only. */
  status: "verified" | "unverified";
  /** ISO 8601. */
  occurredAt: string;
  updatedAt: string;
  location: { lat: number; lng: number };
  magnitude?: number;
  /** Set when relayed from an official authority; otherwise the event is an advisory. */
  official?: { authority: string } | null;
  summary?: string;
  /** Plain-language "What should I do?" steps. */
  guidance?: string[];
  impact?: EventImpact;
  sources?: EventSource[];
}

export interface EventFilters {
  hazards: HazardType[];
  severities: Severity[];
  timeRange: TimeRange;
  bbox?: Bbox | null;
  includeUnverified?: boolean;
}
