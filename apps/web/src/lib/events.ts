import type { DisasterEvent, EventFilters } from "@/types/event";
import { bboxContains } from "@/lib/geo";
import { SEVERITIES, type Severity } from "@/lib/severity";
import { TIME_RANGE_MS } from "@/lib/time-range";

/**
 * Applies the feed and map filters on the client. Used for the demo data; a real backend does the
 * same filtering server-side from query parameters. An empty hazard or severity list means "all".
 */
export function filterEvents(
  events: DisasterEvent[],
  filters: EventFilters,
  now: number = Date.now(),
): DisasterEvent[] {
  const cutoff = now - TIME_RANGE_MS[filters.timeRange];
  return events.filter((event) => {
    if (new Date(event.updatedAt).getTime() < cutoff) return false;
    if (filters.hazards.length > 0 && !filters.hazards.includes(event.type)) return false;
    if (filters.severities.length > 0 && !filters.severities.includes(event.severity)) return false;
    if (!filters.includeUnverified && event.status === "unverified") return false;
    if (filters.bbox && !bboxContains(filters.bbox, event.location.lng, event.location.lat)) {
      return false;
    }
    return true;
  });
}

export function sortNewestFirst(events: DisasterEvent[]): DisasterEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function countBySeverity(events: DisasterEvent[]): Record<Severity, number> {
  const counts = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
  for (const event of events) counts[event.severity] += 1;
  return counts;
}
