import type { Severity } from "@/lib/severity";
import type { DisasterEvent } from "@/types/event";

/**
 * USGS earthquakes, magnitude 2.5+ over the past week. Updated every minute, free, no key, and
 * served with `Access-Control-Allow-Origin: *`, so the browser can read it directly.
 * Feed docs: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
 */
export const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson";

interface UsgsFeature {
  id: string;
  geometry: { coordinates: number[] };
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    updated: number;
    url?: string;
    alert?: string | null;
    status?: string;
    type?: string;
  };
}

const ORDER: Severity[] = ["info", "low", "moderate", "high", "critical"];

/** PAGER estimates shaking impact; it wins when it is higher than the magnitude band. */
const PAGER: Record<string, Severity> = {
  red: "critical",
  orange: "high",
  yellow: "moderate",
  green: "low",
};

export function magnitudeSeverity(mag: number): Severity {
  if (mag >= 7) return "critical";
  if (mag >= 6) return "high";
  if (mag >= 5) return "moderate";
  if (mag >= 4) return "low";
  return "info";
}

export function parseUsgs(payload: { features?: UsgsFeature[] }): DisasterEvent[] {
  const events: DisasterEvent[] = [];
  for (const feature of payload.features ?? []) {
    const p = feature.properties;
    const [lng, lat, depth] = feature.geometry?.coordinates ?? [];
    // The feed also carries quarry blasts and explosions.
    if (p?.type !== "earthquake" || p.mag == null || lat == null || lng == null) continue;

    let severity = magnitudeSeverity(p.mag);
    const pager = p.alert ? PAGER[p.alert] : undefined;
    if (pager && ORDER.indexOf(pager) > ORDER.indexOf(severity)) severity = pager;

    const reviewed = p.status === "reviewed";
    const place = p.place ?? "";
    const updatedAt = new Date(p.updated).toISOString();
    let summary = `Magnitude ${p.mag.toFixed(1)} earthquake`;
    if (place) summary += `, ${place}`;
    if (depth != null) summary += `, at a depth of ${Math.round(depth)} km`;
    summary += ".";
    if (p.alert) summary += ` USGS PAGER impact alert: ${p.alert}.`;

    events.push({
      id: `usgs-${feature.id}`,
      type: "earthquake",
      title: `M${p.mag.toFixed(1)} Earthquake`,
      place,
      severity,
      confidence: reviewed ? 0.95 : 0.8,
      confidenceReasoning: reviewed
        ? "USGS solution reviewed by a seismologist."
        : "Automatic USGS solution, not yet reviewed. Magnitude and location may change.",
      sourceCount: 1,
      status: "verified",
      occurredAt: new Date(p.time).toISOString(),
      updatedAt,
      location: { lat, lng },
      magnitude: Math.round(p.mag * 10) / 10,
      official: null,
      summary,
      sources: [
        {
          id: "usgs",
          name: "USGS Earthquake Hazards Program",
          kind: "sensor",
          reliability: 0.95,
          agreement: 1,
          url: p.url,
          reportedAt: updatedAt,
        },
      ],
    });
  }
  return events;
}

export async function loadUsgs(): Promise<DisasterEvent[]> {
  const response = await fetch(USGS_URL);
  if (!response.ok) throw new Error(`USGS ${response.status}`);
  return parseUsgs(await response.json());
}
