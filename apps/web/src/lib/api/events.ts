import type { DisasterEvent, EventFilters } from "@/types/event";
import { DATA_SOURCE } from "@/lib/env";
import { filterEvents, sortNewestFirst } from "@/lib/events";
import { loadFeedEvents } from "@/lib/feeds";
import { createMockEvents } from "@/lib/mock/events";
import { apiFetch } from "@/lib/api/client";

/** TanStack Query keys. Filters are part of the key, so changing a filter refetches. */
export const eventKeys = {
  all: ["events"] as const,
  list: (filters: EventFilters) => [...eventKeys.all, "list", filters] as const,
  detail: (id: string) => [...eventKeys.all, "detail", id] as const,
};

/** A little latency so loading states are visible while there is no real backend. */
const MOCK_LATENCY_MS = 150;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Events for the filters, newest first: from the feeds, the demo set, or GET /api/events. */
export async function fetchEvents(
  filters: EventFilters,
  signal?: AbortSignal,
): Promise<DisasterEvent[]> {
  if (DATA_SOURCE === "demo") {
    await sleep(MOCK_LATENCY_MS);
    return sortNewestFirst(filterEvents(createMockEvents(), filters));
  }
  if (DATA_SOURCE === "feeds") {
    return sortNewestFirst(filterEvents(await loadFeedEvents(), filters));
  }

  const params = new URLSearchParams({ range: filters.timeRange });
  if (filters.hazards.length) params.set("type", filters.hazards.join(","));
  if (filters.severities.length) params.set("severity", filters.severities.join(","));
  if (filters.bbox) params.set("bbox", filters.bbox.join(","));
  if (filters.includeUnverified) params.set("unverified", "true");
  return apiFetch<DisasterEvent[]>(`/api/events?${params}`, { signal });
}

/** One event by id: from the feeds, the demo set, or GET /api/events/{id}. */
export async function fetchEvent(id: string, signal?: AbortSignal): Promise<DisasterEvent> {
  if (DATA_SOURCE !== "api") {
    if (DATA_SOURCE === "demo") await sleep(MOCK_LATENCY_MS);
    const events = DATA_SOURCE === "demo" ? createMockEvents() : await loadFeedEvents();
    const event = events.find((e) => e.id === id);
    if (!event) throw new Error(`Event ${id} not found`);
    return event;
  }
  return apiFetch<DisasterEvent>(`/api/events/${encodeURIComponent(id)}`, { signal });
}
