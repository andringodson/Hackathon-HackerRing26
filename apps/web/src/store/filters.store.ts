import { create } from "zustand";
import type { HazardType } from "@/lib/hazards";
import type { Severity } from "@/lib/severity";
import { DEFAULT_TIME_RANGE, type TimeRange } from "@/lib/time-range";

/**
 * Feed and map filters (design doc 13.3). An empty list means "all". They apply to the list and
 * the map at the same time because both read the same store.
 */
interface FiltersState {
  hazards: HazardType[];
  severities: Severity[];
  timeRange: TimeRange;

  toggleHazard: (hazard: HazardType) => void;
  toggleSeverity: (severity: Severity) => void;
  setTimeRange: (range: TimeRange) => void;
  reset: () => void;
}

function toggled<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export const useFiltersStore = create<FiltersState>()((set) => ({
  hazards: [],
  severities: [],
  timeRange: DEFAULT_TIME_RANGE,

  toggleHazard: (hazard) => set((s) => ({ hazards: toggled(s.hazards, hazard) })),
  toggleSeverity: (severity) => set((s) => ({ severities: toggled(s.severities, severity) })),
  setTimeRange: (timeRange) => set({ timeRange }),
  reset: () => set({ hazards: [], severities: [], timeRange: DEFAULT_TIME_RANGE }),
}));

/** True if the user has narrowed the feed in any way. */
export function useHasActiveFilters() {
  return useFiltersStore(
    (s) => s.hazards.length > 0 || s.severities.length > 0 || s.timeRange !== DEFAULT_TIME_RANGE,
  );
}
