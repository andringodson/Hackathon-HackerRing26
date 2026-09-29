"use client";

import { useQuery } from "@tanstack/react-query";
import { eventKeys, fetchEvent } from "@/lib/api/events";

/** Full detail for one event, for the right sidebar. Disabled while nothing is selected. */
export function useEvent(id: string | null) {
  return useQuery({
    queryKey: eventKeys.detail(id ?? ""),
    queryFn: ({ signal }) => fetchEvent(id as string, signal),
    enabled: id !== null,
  });
}
