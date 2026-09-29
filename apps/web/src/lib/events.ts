import type { DisasterEvent, EventFilters } from "@/types/event";
import { bboxContains } from "@/lib/geo";
import { ONGOING_HAZARDS } from "@/lib/hazards";
import { SEVERITIES, type Severity } from "@/lib/severity";
import { TIME_RANGE_MS } from "@/lib/time-range";

/**
 * Applies the feed and map filters on the client. Used for the demo data; a real backend does the
 * same filtering server-side from query parameters. An empty hazard or severity list means "all".
 * The time range applies to activityTime, not the raw update time.
 */
export function filterEvents(
  events: DisasterEvent[],
  filters: EventFilters,
  now: number = Date.now(),
): DisasterEvent[] {
  const cutoff = now - TIME_RANGE_MS[filters.timeRange];
  return events.filter((event) => {
    if (activityTime(event) < cutoff) return false;
    if (filters.hazards.length > 0 && !filters.hazards.includes(event.type)) return false;
    if (filters.severities.length > 0 && !filters.severities.includes(event.severity)) return false;
    if (!filters.includeUnverified && event.status === "unverified") return false;
    if (filters.bbox && !bboxContains(filters.bbox, event.location.lng, event.location.lat)) {
      return false;
    }
    return true;
  });
}

/**
 * When an event last mattered, in ms: the last update for ongoing hazards (ONGOING_HAZARDS), the
 * moment it happened for the rest. USGS revises old quakes when a seismologist reviews them; that
 * must not make a three-day-old quake look new.
 */
export function activityTime(event: DisasterEvent): number {
  return new Date(ONGOING_HAZARDS.has(event.type) ? event.updatedAt : event.occurredAt).getTime();
}

export function sortNewestFirst(events: DisasterEvent[]): DisasterEvent[] {
  return [...events].sort((a, b) => activityTime(b) - activityTime(a));
}

export function countBySeverity(events: DisasterEvent[]): Record<Severity, number> {
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
  for (const event of events) counts[event.severity] += 1;
  return counts;
}
