"use client";

import { useEffect } from "react";
import type {
  ExpressionSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
  MapMouseEvent,
} from "maplibre-gl";
import { useViewportEvents } from "@/hooks/useViewportEvents";
import { EVENT_FOCUS_ZOOM, eventsToGeoJSON } from "@/lib/geo";
import { SEVERITY_COLOR } from "@/lib/severity";
import { clearSelection, selectEvent } from "@/store/actions";
import { useMapStore } from "@/store/map.store";

const SOURCE_ID = "events";
const LAYER_ID = "events-circles";

const HOVER = ["boolean", ["feature-state", "hover"], false] as ExpressionSpecification;

/** Unverified events (responders only) are drawn faint so they never look confirmed. */
const UNVERIFIED_FILL = ["case", ["get", "unverified"], 0.45, 1] as ExpressionSpecification;

/** While an event is selected, everything else fades to 40% (design doc 4.5). */
const dimOthers = (selectedId: string) =>
  ["case", ["==", ["get", "id"], selectedId], 1, 0.4] as ExpressionSpecification;

const fillOpacity = (selectedId: string | null) =>
  selectedId ? dimOthers(selectedId) : UNVERIFIED_FILL;
const strokeOpacity = (selectedId: string | null) => (selectedId ? dimOthers(selectedId) : 1);

/** False once the map has been removed. React runs a parent's effect cleanup before its children's. */
function isAlive(map: MapLibreMap) {
  return map.getStyle() !== undefined;
}

/**
 * Hazard markers, drawn by a GeoJSON circle layer rather than DOM nodes so thousands stay cheap.
 * The fill is the severity colour and the outline weight also rises with severity, so severity
 * never depends on colour alone.
 *
 * TODO(F2): per-hazard shapes (ring, triangle, diamond), clustering with a count and the worst
 * severity, a one-time pulse for events under 30 minutes old, a dashed outline for unverified ones.
 */
export function EventsLayer({ map }: { map: MapLibreMap }) {
  const { data } = useViewportEvents();
  const visible = useMapStore((s) => s.layers.events);

  // Add the source and layer once, and wire up interaction.
  useEffect(() => {
    map.addSource(SOURCE_ID, { type: "geojson", data: eventsToGeoJSON([]), promoteId: "id" });
    map.addLayer({
      id: LAYER_ID,
      type: "circle",
      source: SOURCE_ID,
      paint: {
        "circle-radius": ["+", ["get", "radius"], ["case", HOVER, 2, 0]],
        "circle-color": [
          "match",
          ["get", "severity"],
          "critical",
          SEVERITY_COLOR.critical,
          "high",
          SEVERITY_COLOR.high,
          "moderate",
          SEVERITY_COLOR.moderate,
          "low",
          SEVERITY_COLOR.low,
          SEVERITY_COLOR.info,
        ],
        "circle-opacity": UNVERIFIED_FILL,
        "circle-stroke-color": "#f8fafc",
        "circle-stroke-width": ["+", ["get", "outline"], ["case", HOVER, 1, 0]],
        "circle-stroke-opacity": 1,
      },
    });

    const onEnter = (e: MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = "pointer";
      const id = e.features?.[0]?.properties?.id;
      if (typeof id === "string") useMapStore.getState().hoverEvent(id);
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
      useMapStore.getState().hoverEvent(null);
    };
    const onClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
      selectEvent(String(feature.properties.id), { lng, lat, zoom: EVENT_FOCUS_ZOOM });
    };
    // A click that misses every marker deselects and closes the detail panel.
    const onMapClick = (e: MapMouseEvent) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: [LAYER_ID] });
      if (hit.length === 0 && useMapStore.getState().selectedEventId) clearSelection();
    };
    map.on("mouseenter", LAYER_ID, onEnter);
    map.on("mouseleave", LAYER_ID, onLeave);
    map.on("click", LAYER_ID, onClick);
    map.on("click", onMapClick);

    // Follow the stores without re-rendering: dim on selection, highlight on hover.
    let selected: string | null = null;
    let hovered: string | null = null;
    const apply = () => {
      if (!isAlive(map) || !map.getLayer(LAYER_ID)) return;
      const state = useMapStore.getState();
      if (state.selectedEventId !== selected) {
        selected = state.selectedEventId;
        map.setPaintProperty(LAYER_ID, "circle-opacity", fillOpacity(selected));
        map.setPaintProperty(LAYER_ID, "circle-stroke-opacity", strokeOpacity(selected));
      }
      if (state.hoveredEventId !== hovered) {
        if (hovered) map.setFeatureState({ source: SOURCE_ID, id: hovered }, { hover: false });
        hovered = state.hoveredEventId;
        if (hovered) map.setFeatureState({ source: SOURCE_ID, id: hovered }, { hover: true });
      }
    };
    apply();
    const stop = useMapStore.subscribe(apply);

    return () => {
      stop();
      map.off("mouseenter", LAYER_ID, onEnter);
      map.off("mouseleave", LAYER_ID, onLeave);
      map.off("click", LAYER_ID, onClick);
      map.off("click", onMapClick);
      if (!isAlive(map)) return;
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map]);

  // Push new data into the source whenever the query result changes.
  useEffect(() => {
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    void source?.setData(eventsToGeoJSON(data ?? []));
  }, [map, data]);

  // The layers popover switches the whole layer on and off.
  useEffect(() => {
    if (map.getLayer(LAYER_ID)) {
      map.setLayoutProperty(LAYER_ID, "visibility", visible ? "visible" : "none");
    }
  }, [map, visible]);

  return null;
}
