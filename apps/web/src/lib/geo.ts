import type { DisasterEvent } from "@/types/event";
import { SEVERITY_OUTLINE, SEVERITY_RANK } from "@/lib/severity";

/** [west, south, east, north] in degrees. */
export type Bbox = [west: number, south: number, east: number, north: number];

export interface LngLat {
  lng: number;
  lat: number;
}

export interface Viewport extends LngLat {
  zoom: number;
}

/**
 * India with a little margin (where the design doc's examples are). The map fits this on load, so
 * the whole country shows on a phone and on a wide monitor alike. Change it to retarget the app.
 */
export const DEFAULT_BOUNDS: Bbox = [67, 5.5, 99, 37.5];

/** Where the store assumes the camera is until the map reports its real view. */
export const DEFAULT_VIEWPORT: Viewport = { lng: 79, lat: 22.5, zoom: 4.2 };

/** Minimum zoom when flying to a selected event. The map never zooms out to reach it. */
export const EVENT_FOCUS_ZOOM = 6;

/** True if the point is inside the box. Handles boxes that cross the antimeridian. */
export function bboxContains([west, south, east, north]: Bbox, lng: number, lat: number) {
  if (lat < south || lat > north) return false;
  return west <= east ? lng >= west && lng <= east : lng >= west || lng <= east;
}

/** Rounds so tiny pans reuse the same query key instead of refetching. */
export function roundBbox(bbox: Bbox, decimals = 1): Bbox {
  const f = 10 ** decimals;
  return bbox.map((v) => Math.round(v * f) / f) as Bbox;
}

export function formatCoordinates(lat: number, lng: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lng).toFixed(2)}°${ew}`;
}

export interface EventFeatureProps {
  id: string;
  type: DisasterEvent["type"];
  severity: DisasterEvent["severity"];
  /** Circle radius in px. */
  radius: number;
  /** Outline weight in px. */
  outline: number;
  unverified: boolean;
}

/** Marker size: severity sets the base, earthquake magnitude adds to it. */
function markerRadius(event: DisasterEvent) {
  const base = 6 + SEVERITY_RANK[event.severity] * 2;
  const magnitude = event.type === "earthquake" && event.magnitude ? event.magnitude - 4 : 0;
  return Math.round(Math.min(Math.max(base + magnitude, 6), 20));
}

/** The shape MapLibre's GeoJSON source expects. Markers are drawn by a layer, not DOM nodes. */
export function eventsToGeoJSON(
  events: DisasterEvent[],
): GeoJSON.FeatureCollection<GeoJSON.Point, EventFeatureProps> {
  return {
    type: "FeatureCollection",
    features: events.map((event) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [event.location.lng, event.location.lat] },
      properties: {
        id: event.id,
        type: event.type,
        severity: event.severity,
        radius: markerRadius(event),
        outline: SEVERITY_OUTLINE[event.severity],
        unverified: event.status === "unverified",
      },
    })),
  };
}
