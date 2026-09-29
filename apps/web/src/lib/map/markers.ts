import type { Map as MapLibreMap } from "maplibre-gl";
import { HAZARD_TYPES, type HazardType } from "@/lib/hazards";
import { SEVERITIES, SEVERITY_COLOR, SEVERITY_OUTLINE, type Severity } from "@/lib/severity";

/*
 * Marker art (design doc 4.3): one silhouette per hazard, filled with the severity colour and
 * outlined by severity weight, so a marker reads by shape and outline as well as colour. Drawn once
 * per hazard × severity onto a canvas and registered as map images; a symbol layer places them.
 */

/** Diameter in CSS px at icon-size 1. EventsLayer scales each marker from its radius. */
export const MARKER_BASE = 32;
/** Drawn at 2× so markers stay sharp on high-density screens and when scaled up a little. */
const RATIO = 2;
const PAD = 4;
const OUTLINE_COLOR = "rgba(248, 250, 252, 0.95)";

export function markerImageId(type: HazardType, severity: Severity) {
  return `marker-${type}-${severity}`;
}

/** The hazard's silhouette, centred on (c, c) and about r in radius. */
function hazardPath(type: HazardType, c: number, r: number): Path2D {
  const path = new Path2D();
  switch (type) {
    case "earthquake": // a disc; its epicentre ring is drawn separately
      path.arc(c, c, r * 0.58, 0, Math.PI * 2);
      break;
    case "flood": {
      // a water drop, point up
      const top = c - r * 0.95;
      path.moveTo(c, top);
      path.bezierCurveTo(
        c + r * 0.35,
        c - r * 0.35,
        c + r * 0.72,
        c - r * 0.05,
        c + r * 0.72,
        c + r * 0.12,
      );
      path.arc(c, c + r * 0.12, r * 0.72, 0, Math.PI, false);
      path.bezierCurveTo(c - r * 0.72, c - r * 0.05, c - r * 0.35, c - r * 0.35, c, top);
      break;
    }
    case "cyclone": {
      // an eye with two curved arms, like the weather-map symbol
      path.arc(c, c, r * 0.4, 0, Math.PI * 2);
      path.moveTo(c + r * 0.4, c);
      path.quadraticCurveTo(c + r * 0.55, c - r * 0.95, c - r * 0.45, c - r * 0.9);
      path.quadraticCurveTo(c + r * 0.05, c - r * 0.55, c, c - r * 0.4);
      path.moveTo(c - r * 0.4, c);
      path.quadraticCurveTo(c - r * 0.55, c + r * 0.95, c + r * 0.45, c + r * 0.9);
      path.quadraticCurveTo(c - r * 0.05, c + r * 0.55, c, c + r * 0.4);
      break;
    }
    case "wildfire": // a triangle, point up
      path.moveTo(c, c - r * 0.92);
      path.lineTo(c + r * 0.86, c + r * 0.62);
      path.lineTo(c - r * 0.86, c + r * 0.62);
      path.closePath();
      break;
    case "landslide": // a diamond
      path.moveTo(c, c - r * 0.95);
      path.lineTo(c + r * 0.8, c);
      path.lineTo(c, c + r * 0.95);
      path.lineTo(c - r * 0.8, c);
      path.closePath();
      break;
  }
  return path;
}

function drawMarker(type: HazardType, severity: Severity): ImageData | null {
  const size = (MARKER_BASE + PAD * 2) * RATIO;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const c = size / 2;
  const r = (MARKER_BASE / 2) * RATIO;
  const color = SEVERITY_COLOR[severity];

  ctx.lineJoin = "round";
  if (type === "earthquake") {
    // Epicentre ring around the disc.
    ctx.beginPath();
    ctx.arc(c, c, r * 0.88, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = r * 0.12;
    ctx.stroke();
  }
  const path = hazardPath(type, c, r);
  ctx.fillStyle = color;
  ctx.fill(path, "nonzero");
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = SEVERITY_OUTLINE[severity] * RATIO;
  ctx.stroke(path);
  return ctx.getImageData(0, 0, size, size);
}

/** Registers every marker image once. Safe to call again after a style reload. */
export function addMarkerImages(map: MapLibreMap) {
  for (const type of HAZARD_TYPES) {
    for (const severity of SEVERITIES) {
      const id = markerImageId(type, severity);
      if (map.hasImage(id)) continue;
      const image = drawMarker(type, severity);
      if (image) map.addImage(id, image, { pixelRatio: RATIO });
    }
  }
}

/** Icon scale for a feature's radius, so markers keep the sizes from lib/geo.ts markerRadius. */
export const MARKER_SIZE_EXPRESSION = ["/", ["*", 2, ["get", "radius"]], MARKER_BASE] as const;
