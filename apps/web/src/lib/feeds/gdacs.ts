import type { HazardType } from "@/lib/hazards";
import type { Severity } from "@/lib/severity";
import type { DisasterEvent } from "@/types/event";

/**
 * GDACS (UN and European Commission) alerts: the 100 most recently updated current events. Free,
 * no key, `Access-Control-Allow-Origin: *`. Earthquakes are skipped because USGS covers them in
 * more detail; merging duplicates across sources is the verification agent's job later.
 */
export const GDACS_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP";

interface GdacsFeature {
  geometry: { type: string; coordinates: number[] };
  properties: {
    eventtype: string;
    eventid: number;
    name?: string;
    description?: string;
    alertlevel?: string;
    country?: string;
    fromdate: string;
    datemodified: string;
    severitydata?: { severitytext?: string };
    url?: { report?: string };
  };
}

const HAZARDS: Record<string, HazardType> = { TC: "cyclone", FL: "flood", WF: "wildfire" };
const SEVERITY: Record<string, Severity> = { red: "critical", orange: "high", green: "low" };

/** GDACS timestamps are UTC without an offset. */
const utc = (value: string) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);

export function coordinatesLabel(lat: number, lng: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(1)}°${ns}, ${Math.abs(lng).toFixed(1)}°${ew}`;
}

export function parseGdacs(payload: { features?: GdacsFeature[] }): DisasterEvent[] {
  const events: DisasterEvent[] = [];
  for (const feature of payload.features ?? []) {
    const p = feature.properties;
    const type = HAZARDS[p?.eventtype];
    if (!type || feature.geometry?.type !== "Point") continue;
    const [lng, lat] = feature.geometry.coordinates;
    const updated = utc(p.datemodified);
    const occurred = utc(p.fromdate);
    if (Number.isNaN(updated.getTime()) || Number.isNaN(occurred.getTime())) continue;

    const level = (p.alertlevel ?? "Green").trim();
    let summary = `GDACS ${level.toLowerCase()} alert.`;
    const severityText = p.severitydata?.severitytext?.trim();
    // Flood severity text is a placeholder ("Magnitude 0"), so it is left out.
    if (severityText && type !== "flood") summary += ` ${severityText}.`;
    const updatedAt = updated.toISOString();

    events.push({
      id: `gdacs-${p.eventtype.toLowerCase()}-${p.eventid}`,
      type,
      title: p.name || p.description || type,
      place: p.country?.trim() || coordinatesLabel(lat, lng),
      severity: SEVERITY[level.toLowerCase()] ?? "low",
      confidence: 0.85,
      confidenceReasoning: `Single source: GDACS ${level.toLowerCase()} alert, from impact models.`,
      sourceCount: 1,
      status: "verified",
      occurredAt: occurred.toISOString(),
      updatedAt,
      location: { lat, lng },
      official: null,
      summary,
      sources: [
        {
          id: "gdacs",
          name: "GDACS",
          kind: "official",
          reliability: 0.9,
          agreement: 1,
          url: p.url?.report,
          reportedAt: updatedAt,
        },
      ],
    });
  }
  return events;
}

export async function loadGdacs(): Promise<DisasterEvent[]> {
  const response = await fetch(GDACS_URL);
  if (!response.ok) throw new Error(`GDACS ${response.status}`);
  return parseGdacs(await response.json());
}
