import type { Map as MapLibreMap } from "maplibre-gl";
import type { LayerId } from "@/lib/map/layers";

/*
 * The basemap is the OpenFreeMap dark style. It is quieter than a full street map, but the design
 * doc wants hazard data to be the only bright thing, so we hide detail on top of it.
 *
 * These are layer ids from that style. If NEXT_PUBLIC_MAP_STYLE_URL points at a different style
 * the ids simply won't match and nothing is hidden.
 */

/** Roads and rail. Hidden by default and shown by the "Roads and routes" layer toggle. */
const ROAD_LAYER_IDS = [
  "highway_path",
  "highway_minor",
  "highway_major_casing",
  "highway_major_inner",
  "highway_major_subtle",
  "highway_motorway_casing",
  "highway_motorway_inner",
  "highway_motorway_subtle",
  "road_area_pier",
  "road_pier",
  "road_oneway",
  "road_oneway_opposite",
  "railway_transit",
  "railway_transit_dashline",
  "railway_minor",
  "railway_minor_dashline",
  "railway",
  "railway_dashline",
  "highway_name_other",
  "highway_name_motorway",
];

/** Detail that competes with hazard markers: buildings, airports, small places. */
const ALWAYS_HIDDEN_LAYER_IDS = [
  "building",
  "aeroway-taxiway",
  "aeroway-runway-casing",
  "aeroway-area",
  "aeroway-runway",
  "place_other",
  "place_suburb",
  "place_village",
];

function setVisibility(map: MapLibreMap, ids: string[], visible: boolean) {
  for (const id of ids) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
  }
}

/** Call once after the style has loaded. */
/** OLED black: land is pure black like the UI, water a faint deep blue so coastlines still read. */
const OLED_PAINT: [layer: string, property: string, value: string][] = [
  ["background", "background-color", "#000000"],
  ["water", "fill-color", "#070b12"],
  ["waterway", "line-color", "#070b12"],
];

export function applyBasemapTweaks(map: MapLibreMap, layers: Record<LayerId, boolean>) {
  setVisibility(map, ALWAYS_HIDDEN_LAYER_IDS, false);
  setVisibility(map, ROAD_LAYER_IDS, layers.roads);
  for (const [id, property, value] of OLED_PAINT) {
    if (map.getLayer(id)) map.setPaintProperty(id, property, value);
  }
}

/** Basemap-backed layers respond to the layers popover here. Data layers manage themselves. */
export function applyBasemapLayerVisibility(map: MapLibreMap, layers: Record<LayerId, boolean>) {
  setVisibility(map, ROAD_LAYER_IDS, layers.roads);
}
