"use client";

import { useMapContext } from "@/components/map/MapProvider";

/** The MapLibre instance, or null until the map has loaded. Prefer the stores for anything stateful. */
export function useMapInstance() {
  return useMapContext().map;
}

/** For MapCanvas only: publishes the instance so useMapInstance can see it. */
export function useRegisterMap() {
  return useMapContext().register;
}
