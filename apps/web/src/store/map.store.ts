import { create } from "zustand";
import { DEFAULT_VIEWPORT, type Bbox, type Viewport } from "@/lib/geo";
import { defaultLayerState, type LayerId } from "@/lib/map/layers";

/** Ask the map to fly somewhere. A fresh object each time, so re-selecting the same event re-flies. */
export interface FocusRequest {
  lng: number;
  lat: number;
  /** Minimum zoom to end at. The map never zooms out to satisfy this. */
  zoom?: number;
}

/**
 * Map-facing state (design doc 13.3). Components write here; components/map/storeSync.ts is the
 * adapter that applies it to MapLibre, so the map itself never re-renders with the UI.
 */
interface MapState {
  viewport: Viewport;
  /** Visible bounds, or null until the map has loaded. */
  bounds: Bbox | null;
  selectedEventId: string | null;
  hoveredEventId: string | null;
  layers: Record<LayerId, boolean>;
  /** Forecast horizon in hours ahead; 0 is now. */
  forecastTime: number;
  focusRequest: FocusRequest | null;

  setViewport: (viewport: Viewport, bounds: Bbox) => void;
  /** Prefer selectEvent / clearSelection in store/actions.ts, which also open and close the sidebar. */
  setSelected: (id: string | null, focus?: FocusRequest) => void;
  /** Fly somewhere without changing the selection, for example to the user's location. */
  focusOn: (focus: FocusRequest) => void;
  hoverEvent: (id: string | null) => void;
  setLayer: (id: LayerId, on: boolean) => void;
  toggleLayer: (id: LayerId) => void;
  setForecastTime: (hours: number) => void;
}

export const useMapStore = create<MapState>()((set) => ({
  viewport: DEFAULT_VIEWPORT,
  bounds: null,
  selectedEventId: null,
  hoveredEventId: null,
  layers: defaultLayerState(),
  forecastTime: 0,
  focusRequest: null,

  setViewport: (viewport, bounds) => set({ viewport, bounds }),
  setSelected: (selectedEventId, focus) =>
    set({ selectedEventId, focusRequest: focus ? { ...focus } : null }),
  focusOn: (focus) => set({ focusRequest: { ...focus } }),
  hoverEvent: (hoveredEventId) => set({ hoveredEventId }),
  setLayer: (id, on) => set((s) => ({ layers: { ...s.layers, [id]: on } })),
  toggleLayer: (id) => set((s) => ({ layers: { ...s.layers, [id]: !s.layers[id] } })),
  setForecastTime: (forecastTime) => set({ forecastTime }),
}));
