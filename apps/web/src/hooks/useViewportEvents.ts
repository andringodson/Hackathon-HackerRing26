"use client";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { roundBbox } from "@/lib/geo";
import { useMapStore } from "@/store/map.store";

const VIEWPORT_DEBOUNCE_MS = 300;

/**
 * Events inside the visible map area. The bbox is debounced (300 ms, design doc 4.5) and rounded,
 * so panning does not fire a request per frame. Feeds the map's events layer.
 */
export function useViewportEvents() {
  const bounds = useMapStore((s) => s.bounds);
  const bbox = useDebouncedValue(bounds ? roundBbox(bounds, 1) : null, VIEWPORT_DEBOUNCE_MS);
  return useLiveEvents({ bbox });
}
