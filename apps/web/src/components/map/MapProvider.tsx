"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
// Type-only, so the map library stays out of the main bundle. MapCanvas is loaded lazily.
import type { Map as MapLibreMap } from "maplibre-gl";

interface MapContextValue {
  /** Null until the map has loaded its style. */
  map: MapLibreMap | null;
  register: (map: MapLibreMap | null) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

/**
 * Lets siblings of the map (MapControls, for now) reach the MapLibre instance. Everything else
 * should go through the stores instead, so the map and the UI stay decoupled.
 */
export function MapProvider({ children }: { children: ReactNode }) {
  const [map, register] = useState<MapLibreMap | null>(null);
  const value = useMemo(() => ({ map, register }), [map]);
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapContext(): MapContextValue {
  const context = useContext(MapContext);
  if (!context) throw new Error("useMapContext must be used inside <MapProvider>");
  return context;
}
