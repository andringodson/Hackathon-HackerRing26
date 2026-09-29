"use client";

import type { Map as MapLibreMap } from "maplibre-gl";
import { EventsLayer } from "@/components/map/layers/EventsLayer";
import { ForecastLayer } from "@/components/map/layers/ForecastLayer";
import { PopulationLayer } from "@/components/map/layers/PopulationLayer";
import { ResourcesLayer } from "@/components/map/layers/ResourcesLayer";

/**
 * Mount point for every data layer. Rendered by MapCanvas once the style has loaded, so layers can
 * add their sources straight away. To add a layer: build it like EventsLayer, and mount it here.
 */
export function MapLayers({ map }: { map: MapLibreMap }) {
  return (
    <>
      <EventsLayer map={map} />
      <ForecastLayer />
      <PopulationLayer />
      <ResourcesLayer />
    </>
  );
}
