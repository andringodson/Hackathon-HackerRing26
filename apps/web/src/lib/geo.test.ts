import { describe, expect, it } from "vitest";
import { createMockEvents } from "@/lib/mock/events";
import { bboxContains, eventsToGeoJSON, formatCoordinates, roundBbox } from "@/lib/geo";
import { SEVERITY_OUTLINE } from "@/lib/severity";

describe("bboxContains", () => {
  const india: [number, number, number, number] = [68, 6, 98, 36];

  it("includes points inside and excludes points outside", () => {
    expect(bboxContains(india, 79, 22)).toBe(true);
    expect(bboxContains(india, 10, 22)).toBe(false);
    expect(bboxContains(india, 79, 60)).toBe(false);
  });

  it("includes the edges", () => {
    expect(bboxContains(india, 68, 6)).toBe(true);
    expect(bboxContains(india, 98, 36)).toBe(true);
  });

  it("handles a box that crosses the antimeridian", () => {
    const fiji: [number, number, number, number] = [170, -25, -170, -10];
    expect(bboxContains(fiji, 178, -18)).toBe(true);
    expect(bboxContains(fiji, -175, -18)).toBe(true);
    expect(bboxContains(fiji, 0, -18)).toBe(false);
  });
});

describe("roundBbox", () => {
  it("rounds so nearby pans share a query key", () => {
    expect(roundBbox([68.04, 6.06, 97.96, 35.94], 1)).toEqual([68, 6.1, 98, 35.9]);
  });
});

describe("formatCoordinates", () => {
  it("shows hemispheres", () => {
    expect(formatCoordinates(26.14, 92.93)).toBe("26.14°N 92.93°E");
    expect(formatCoordinates(-33.87, -70.65)).toBe("33.87°S 70.65°W");
  });
});

describe("eventsToGeoJSON", () => {
  const events = createMockEvents();
  const collection = eventsToGeoJSON(events);

  it("makes one point per event, as [lng, lat]", () => {
    expect(collection.features).toHaveLength(events.length);
    const quake = collection.features.find((f) => f.properties.id === "demo-quake-assam");
    expect(quake?.geometry.coordinates).toEqual([92.93, 26.14]);
  });

  it("weights the outline by severity", () => {
    const quake = collection.features.find((f) => f.properties.id === "demo-quake-assam");
    expect(quake?.properties.outline).toBe(SEVERITY_OUTLINE.critical);
  });

  it("carries the marker image and the severity rank for clusters", () => {
    const quake = collection.features.find((f) => f.properties.id === "demo-quake-assam");
    expect(quake?.properties.icon).toBe("marker-earthquake-critical");
    expect(quake?.properties.rank).toBe(4);
  });

  it("marks quakes under 30 minutes old as fresh, but never ongoing hazards", () => {
    const [quake] = events.filter((e) => e.type === "earthquake");
    const [flood] = events.filter((e) => e.type === "flood");
    const at = Date.parse(quake.occurredAt);
    const props = (now: number, e = quake) => eventsToGeoJSON([e], now).features[0].properties;
    expect(props(at + 10 * 60_000).fresh).toBe(true);
    expect(props(at + 40 * 60_000).fresh).toBe(false);
    expect(props(Date.parse(flood.occurredAt), flood).fresh).toBe(false);
  });

  it("keeps marker sizes in a sane range, and bigger for worse events", () => {
    const radii = collection.features.map((f) => f.properties.radius);
    expect(Math.min(...radii)).toBeGreaterThanOrEqual(6);
    expect(Math.max(...radii)).toBeLessThanOrEqual(20);
    const critical = collection.features.find((f) => f.properties.severity === "critical");
    const info = collection.features.find((f) => f.properties.severity === "info");
    expect(critical!.properties.radius).toBeGreaterThan(info!.properties.radius);
  });

  it("flags unverified events", () => {
    const unverified = collection.features.filter((f) => f.properties.unverified);
    expect(unverified.map((f) => f.properties.id)).toEqual(["demo-landslide-idukki"]);
  });
});
