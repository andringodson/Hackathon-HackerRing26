"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchEvents, eventKeys } from "@/lib/api/events";
import { USE_MOCKS } from "@/lib/env";
import type { Bbox } from "@/lib/geo";
import { canSeeUnverified } from "@/lib/roles";
import { useRole } from "@/components/shell/RoleProvider";
import { useFiltersStore } from "@/store/filters.store";
import type { EventFilters } from "@/types/event";

const POLL_INTERVAL_MS = 30_000;

/**
 * Events for the current filters, newest first. Feeds the left sidebar and the status strip.
 * Pass a bbox to limit to an area (see useViewportEvents).
 *
 * Polls every 30 s for now. TODO(F4): push updates over the WebSocket into this query cache, batched
 * every 500 ms, and keep polling only as the fallback.
 */
export function useLiveEvents({ bbox = null }: { bbox?: Bbox | null } = {}) {
  const role = useRole();
  const hazards = useFiltersStore((s) => s.hazards);
  const severities = useFiltersStore((s) => s.severities);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const includeUnverified = canSeeUnverified(role);

  const filters = useMemo<EventFilters>(
    () => ({ hazards, severities, timeRange, bbox, includeUnverified }),
    [hazards, severities, timeRange, bbox, includeUnverified],
  );

  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: ({ signal }) => fetchEvents(filters, signal),
    refetchInterval: USE_MOCKS ? false : POLL_INTERVAL_MS,
    // Keep showing the previous list while a new filter or viewport loads, so nothing flickers.
    placeholderData: keepPreviousData,
  });
}
