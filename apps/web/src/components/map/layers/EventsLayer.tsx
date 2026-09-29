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
import { addMarkerImages, MARKER_SIZE_EXPRESSION } from "@/lib/map/markers";
import { SEVERITY_COLOR } from "@/lib/severity";
import { clearSelection, selectEvent } from "@/store/actions";
import { useMapStore } from "@/store/map.store";

const SOURCE_ID = "events";
const CLUSTER_LAYER = "events-clusters";
const COUNT_LAYER = "events-cluster-count";
const PULSE_LAYER = "events-pulse";
const FOCUS_LAYER = "events-focus";
const MARKER_LAYER = "events-markers";
const LAYERS = [CLUSTER_LAYER, COUNT_LAYER, PULSE_LAYER, FOCUS_LAYER, MARKER_LAYER];
const HIT_LAYERS = [MARKER_LAYER, CLUSTER_LAYER];

/** Clusters break up by this zoom, below EVENT_FOCUS_ZOOM, so a selected event is always a marker. */
const CLUSTER_MAX_ZOOM = 5;
const ACCENT = "#22d3ee";
const PULSE_MS = 2000;
/** The live cursor locks on over elements with this attribute (components/shell/LiveCursor.tsx). */
const CURSOR_TARGET_ATTR = "data-cursor-target";

const IS_CLUSTER = ["has", "point_count"] as ExpressionSpecification;
const IS_POINT = ["!", ["has", "point_count"]] as ExpressionSpecification;
const HOVER = ["boolean", ["feature-state", "hover"], false] as ExpressionSpecification;

/** Worst severity inside a cluster, as its colour. */
const RANK_COLOR = [
  "match",
  ["get", "rank"],
  4,
  SEVERITY_COLOR.critical,
  3,
  SEVERITY_COLOR.high,
  2,
  SEVERITY_COLOR.moderate,
  1,
  SEVERITY_COLOR.low,
  SEVERITY_COLOR.info,
] as ExpressionSpecification;

/** Unverified events (responders only) are drawn faint; with a selection, the rest fade to 40%. */
function markerOpacity(selectedId: string | null): ExpressionSpecification {
  return selectedId
    ? ["case", ["==", ["get", "id"], selectedId], 1, 0.4]
    : ["case", ["get", "unverified"], 0.45, 1];
}

/** The cyan target ring: solid on the selected event, fainter on the hovered one. */
function focusOpacity(selectedId: string | null): ExpressionSpecification {
  return ["case", ["==", ["get", "id"], selectedId ?? ""], 1, HOVER, 0.6, 0];
}

/** False once the map has been removed. React runs a parent's effect cleanup before its children's. */
function isAlive(map: MapLibreMap) {
  return map.getStyle() !== undefined;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Hazard markers (design doc 4.3 to 4.5), drawn by map layers rather than DOM nodes so thousands
 * stay cheap:
 * - one silhouette per hazard in its severity colour (lib/map/markers.ts), sized by severity and
 *   earthquake magnitude;
 * - clusters below zoom 6 with the count and a ring in the worst severity inside; click to zoom in;
 * - a cyan target ring on the hovered and the selected event, and the rest fade while one is
 *   selected;
 * - a radar pulse on quakes and landslides under 30 minutes old.
 */
export function EventsLayer({ map }: { map: MapLibreMap }) {
  const { data } = useViewportEvents();
  const visible = useMapStore((s) => s.layers.events);

  // Add the source and layers once, and wire up interaction.
  useEffect(() => {
    addMarkerImages(map);
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: eventsToGeoJSON([]),
      promoteId: "id",
      cluster: true,
      clusterMaxZoom: CLUSTER_MAX_ZOOM,
      clusterRadius: 44,
      clusterProperties: { rank: ["max", ["get", "rank"]] },
    });

    map.addLayer({
      id: CLUSTER_LAYER,
      type: "circle",
      source: SOURCE_ID,
      filter: IS_CLUSTER,
      paint: {
        "circle-radius": ["step", ["get", "point_count"], 14, 10, 17, 50, 21, 200, 25],
        "circle-color": "#000000",
        "circle-opacity": 0.78,
        "circle-stroke-color": RANK_COLOR,
        "circle-stroke-width": ["case", HOVER, 3, 2],
      },
    });
    map.addLayer({
      id: COUNT_LAYER,
      type: "symbol",
      source: SOURCE_ID,
      filter: IS_CLUSTER,
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
        "text-allow-overlap": true,
      },
      paint: { "text-color": "#e8ecf2" },
    });
    map.addLayer({
      id: PULSE_LAYER,
      type: "circle",
      source: SOURCE_ID,
      filter: ["all", IS_POINT, ["==", ["get", "fresh"], true]],
      paint: {
        "circle-radius": ["get", "radius"],
        "circle-color": "rgba(0,0,0,0)",
        "circle-stroke-color": RANK_COLOR,
        "circle-stroke-width": 1.5,
        "circle-stroke-opacity": 0,
      },
    });
    map.addLayer({
      id: FOCUS_LAYER,
      type: "circle",
      source: SOURCE_ID,
      filter: IS_POINT,
      paint: {
        "circle-radius": ["+", ["get", "radius"], 6],
        "circle-color": "rgba(0,0,0,0)",
        "circle-stroke-color": ACCENT,
        "circle-stroke-width": 1.5,
        "circle-stroke-opacity": focusOpacity(null),
      },
    });
    map.addLayer({
      id: MARKER_LAYER,
      type: "symbol",
      source: SOURCE_ID,
      filter: IS_POINT,
      layout: {
        "icon-image": ["get", "icon"],
        "icon-size": MARKER_SIZE_EXPRESSION as unknown as ExpressionSpecification,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        // Worse events on top.
        "symbol-sort-key": ["get", "rank"],
      },
      paint: { "icon-opacity": markerOpacity(null) },
    });

    const container = map.getCanvasContainer();
    let hoveredFeature: string | number | null = null;
    const setHoverState = (id: string | number | null) => {
      if (hoveredFeature != null) {
        map.setFeatureState({ source: SOURCE_ID, id: hoveredFeature }, { hover: false });
      }
      hoveredFeature = id;
      if (id != null) map.setFeatureState({ source: SOURCE_ID, id }, { hover: true });
    };

    const onEnter = (e: MapLayerMouseEvent) => {
      container.setAttribute(CURSOR_TARGET_ATTR, "");
      const feature = e.features?.[0];
      if (!feature) return;
      const id = feature.properties?.id;
      if (typeof id === "string") useMapStore.getState().hoverEvent(id);
      else if (feature.id != null) setHoverState(feature.id); // a cluster
    };
    const onLeave = () => {
      container.removeAttribute(CURSOR_TARGET_ATTR);
      useMapStore.getState().hoverEvent(null);
      setHoverState(null);
    };
    const onMarkerClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
      selectEvent(String(feature.properties.id), { lng, lat, zoom: EVENT_FOCUS_ZOOM });
    };
    const onClusterClick = async (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      const clusterId = feature?.properties?.cluster_id;
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (!feature || clusterId == null || !source) return;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      if (!isAlive(map)) return;
      map.easeTo({
        center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
        zoom: Math.min(zoom, CLUSTER_MAX_ZOOM + 1),
        duration: prefersReducedMotion() ? 0 : 500,
      });
    };
    // A click that misses every marker and cluster deselects and closes the detail panel.
    const onMapClick = (e: MapMouseEvent) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: HIT_LAYERS });
      if (hit.length === 0 && useMapStore.getState().selectedEventId) clearSelection();
    };
    for (const layer of HIT_LAYERS) {
      map.on("mouseenter", layer, onEnter);
      map.on("mouseleave", layer, onLeave);
    }
    map.on("click", MARKER_LAYER, onMarkerClick);
    map.on("click", CLUSTER_LAYER, onClusterClick);
    map.on("click", onMapClick);

    // Follow the stores without re-rendering: fade on selection, target ring on hover.
    let selected: string | null = null;
    let hovered: string | null = null;
    const apply = () => {
      if (!isAlive(map) || !map.getLayer(MARKER_LAYER)) return;
      const state = useMapStore.getState();
      if (state.selectedEventId !== selected) {
        selected = state.selectedEventId;
        map.setPaintProperty(MARKER_LAYER, "icon-opacity", markerOpacity(selected));
        map.setPaintProperty(FOCUS_LAYER, "circle-stroke-opacity", focusOpacity(selected));
        map.setPaintProperty(CLUSTER_LAYER, "circle-opacity", selected ? 0.4 : 0.78);
      }
      if (state.hoveredEventId !== hovered) {
        hovered = state.hoveredEventId;
        setHoverState(hovered);
      }
    };
    apply();
    const stop = useMapStore.subscribe(apply);

    // Radar pulse: one ring expanding and fading every 2 s. Only runs while a fresh event is drawn.
    let frame = 0;
    const pulse = (time: number) => {
      frame = 0;
      if (!isAlive(map) || !map.getLayer(PULSE_LAYER)) return;
      const t = (time % PULSE_MS) / PULSE_MS;
      map.setPaintProperty(PULSE_LAYER, "circle-radius", ["+", ["get", "radius"], 4 + 18 * t]);
      map.setPaintProperty(PULSE_LAYER, "circle-stroke-opacity", 0.7 * (1 - t));
      frame = requestAnimationFrame(pulse);
    };
    const onData = () => {
      if (prefersReducedMotion() || !map.getLayer(PULSE_LAYER)) return;
      const anyFresh = map.querySourceFeatures(SOURCE_ID).some((f) => f.properties?.fresh === true);
      if (anyFresh && !frame) frame = requestAnimationFrame(pulse);
      if (!anyFresh && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    map.on("sourcedata", onData);

    return () => {
      stop();
      cancelAnimationFrame(frame);
      container.removeAttribute(CURSOR_TARGET_ATTR);
      map.off("sourcedata", onData);
      for (const layer of HIT_LAYERS) {
        map.off("mouseenter", layer, onEnter);
        map.off("mouseleave", layer, onLeave);
      }
      map.off("click", MARKER_LAYER, onMarkerClick);
      map.off("click", CLUSTER_LAYER, onClusterClick);
      map.off("click", onMapClick);
      if (!isAlive(map)) return;
      for (const layer of [...LAYERS].reverse()) if (map.getLayer(layer)) map.removeLayer(layer);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map]);

  // Push new data into the source whenever the query result changes.
  useEffect(() => {
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    void source?.setData(eventsToGeoJSON(data ?? []));
  }, [map, data]);

  // The layers popover switches all event layers on and off together.
  useEffect(() => {
    for (const layer of LAYERS) {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, "visibility", visible ? "visible" : "none");
      }
    }
  }, [map, visible]);

  return null;
}
