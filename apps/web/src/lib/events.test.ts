import { describe, expect, it } from "vitest";
import { activityTime, countBySeverity, filterEvents, sortNewestFirst } from "@/lib/events";
import { createMockEvents } from "@/lib/mock/events";
import type { EventFilters } from "@/types/event";

const NOW = Date.parse("2026-09-29T10:00:00Z");
const events = createMockEvents(NOW);
const base: EventFilters = {
  hazards: [],
  severities: [],
  timeRange: "7d",
  includeUnverified: true,
};
const ids = (list: typeof events) => list.map((e) => e.id);

describe("filterEvents", () => {
  it("returns everything in range when no filter is set", () => {
    expect(filterEvents(events, base, NOW)).toHaveLength(events.length);
  });

  it("limits by time range", () => {
    const day = filterEvents(events, { ...base, timeRange: "24h" }, NOW);
    expect(ids(day)).not.toContain("demo-quake-nepal"); // three days old
    expect(ids(day)).toContain("demo-quake-assam");

    const hour = filterEvents(events, { ...base, timeRange: "1h" }, NOW);
    expect(ids(hour)).toContain("demo-quake-assam");
    expect(ids(hour)).not.toContain("demo-landslide-wayanad");
  });

  it("limits by hazard", () => {
    const floods = filterEvents(events, { ...base, hazards: ["flood"] }, NOW);
    expect(floods.every((e) => e.type === "flood")).toBe(true);
    expect(floods.length).toBeGreaterThan(0);
  });

  it("limits by severity", () => {
    const critical = filterEvents(events, { ...base, severities: ["critical"] }, NOW);
    expect(ids(critical)).toEqual(["demo-quake-assam"]);
  });

  it("hides unverified events unless asked", () => {
    expect(ids(filterEvents(events, { ...base, includeUnverified: false }, NOW))).not.toContain(
      "demo-landslide-idukki",
    );
    expect(ids(filterEvents(events, base, NOW))).toContain("demo-landslide-idukki");
  });

  it("limits to a bounding box", () => {
    const kerala = filterEvents(events, { ...base, bbox: [74, 8, 78, 13] }, NOW);
    expect(ids(kerala).sort()).toEqual([
      "demo-flood-kerala",
      "demo-landslide-idukki",
      "demo-landslide-wayanad",
    ]);
  });

  it("combines filters", () => {
    const result = filterEvents(
      events,
      { ...base, hazards: ["landslide"], bbox: [74, 8, 78, 13], includeUnverified: false },
      NOW,
    );
    expect(ids(result)).toEqual(["demo-landslide-wayanad"]);
  });
});

describe("sortNewestFirst", () => {
  it("orders by activity, newest first, without mutating the input", () => {
    const shuffled = [...events].reverse();
    const sorted = sortNewestFirst(shuffled);
    expect(sorted[0].id).toBe("demo-quake-assam");
    expect(sorted.at(-1)?.id).toBe("demo-quake-nepal");
    expect(shuffled[0].id).toBe("demo-quake-nepal");
  });
});

describe("activityTime", () => {
  const quake = events.find((e) => e.type === "earthquake")!;
  const flood = events.find((e) => e.type === "flood")!;

  it("is when a quake happened, even if it was revised later", () => {
    const revised = { ...quake, updatedAt: new Date(NOW).toISOString() };
    expect(activityTime(revised)).toBe(Date.parse(quake.occurredAt));
    expect(
      ids(
        filterEvents(
          [{ ...revised, occurredAt: new Date(NOW - 3 * 86_400_000).toISOString() }],
          { ...base, timeRange: "24h" },
          NOW,
        ),
      ),
    ).toEqual([]);
  });

  it("is the last update for an ongoing flood", () => {
    expect(activityTime(flood)).toBe(Date.parse(flood.updatedAt));
  });
});

describe("countBySeverity", () => {
  it("counts every level, including empty ones", () => {
    const counts = countBySeverity(events);
    expect(counts.critical).toBe(1);
    expect(counts.high).toBe(3);
    expect(counts.moderate).toBe(3);
    expect(counts.low).toBe(1);
    expect(counts.info).toBe(1);
    expect(countBySeverity([]).critical).toBe(0);
  });
});
