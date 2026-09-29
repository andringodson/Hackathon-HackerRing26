// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadFeedEvents, resetFeedCache } from "@/lib/feeds";
import { coordinatesLabel, parseGdacs } from "@/lib/feeds/gdacs";
import { magnitudeSeverity, parseUsgs } from "@/lib/feeds/usgs";
import gdacs from "@/lib/feeds/fixtures/gdacs.json";
import usgs from "@/lib/feeds/fixtures/usgs.json";

// Trimmed copies of the real feeds (29 Sep 2026).

describe("USGS", () => {
  const events = parseUsgs(usgs);
  const byId = Object.fromEntries(events.map((e) => [e.id, e]));

  it("keeps earthquakes only", () => {
    expect(events.map((e) => e.id)).toEqual([
      "usgs-us6000tyc3",
      "usgs-nc75444432",
      "usgs-us6000tyc9",
    ]); // the mining explosion is gone
  });

  it("maps a feature to the frontend event shape", () => {
    const quake = byId["usgs-us6000tyc9"];
    expect(quake).toMatchObject({
      type: "earthquake",
      title: "M5.0 Earthquake",
      place: "58 km NW of Pante Makasar, Timor Leste",
      severity: "moderate",
      magnitude: 5,
      status: "verified",
      sourceCount: 1,
      occurredAt: new Date(1790691246077).toISOString(),
      updatedAt: new Date(1790694934040).toISOString(),
    });
    expect(quake.sources?.[0]).toMatchObject({ id: "usgs", kind: "sensor" });
  });

  it("trusts automatic solutions less than reviewed ones", () => {
    expect(byId["usgs-nc75444432"].confidence).toBeLessThan(byId["usgs-us6000tyc3"].confidence);
  });

  it("takes the higher of the magnitude band and the PAGER alert", () => {
    expect(magnitudeSeverity(7.2)).toBe("critical");
    expect(magnitudeSeverity(3.1)).toBe("info");
    const [feature] = usgs.features;
    const withAlert = (mag: number, alert: string) =>
      parseUsgs({ features: [{ ...feature, properties: { ...feature.properties, mag, alert } }] })[0];
    expect(withAlert(4.2, "orange").severity).toBe("high");
    expect(withAlert(6.5, "green").severity).toBe("high");
  });
});

describe("GDACS", () => {
  const events = parseGdacs(gdacs);
  const byId = Object.fromEntries(events.map((e) => [e.id, e]));

  it("keeps cyclones, floods and wildfires, and leaves earthquakes to USGS", () => {
    expect(events.map((e) => e.type).sort()).toEqual(["cyclone", "cyclone", "flood", "wildfire"]);
  });

  it("maps fields and reads GDACS times as UTC", () => {
    const cyclone = byId["gdacs-tc-1001321"];
    expect(cyclone).toMatchObject({
      title: "Tropical Cyclone NOLO-26",
      place: "United States",
      severity: "low",
      updatedAt: "2026-09-29T16:22:22.000Z",
    });
    expect(cyclone.summary).toContain("250 km/h");
    expect(cyclone.sources?.[0].url).toMatch(/^https:\/\/www\.gdacs\.org\/report\.aspx/);
  });

  it("falls back to coordinates at sea and drops placeholder flood text", () => {
    expect(byId["gdacs-tc-1001323"].place).toMatch(/°[NS], .*°[EW]$/);
    expect(byId["gdacs-fl-1104178"].summary).not.toContain("Magnitude");
    expect(coordinatesLabel(-17.25, 178.04)).toBe("17.3°S, 178.0°E");
  });
});

describe("loadFeedEvents", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetFeedCache();
  });

  const respond = (routes: Record<string, unknown>) =>
    vi.fn(async (url: string) => {
      const key = Object.keys(routes).find((k) => url.includes(k));
      const body = key ? routes[key] : undefined;
      return body === undefined
        ? new Response("down", { status: 503 })
        : new Response(JSON.stringify(body), { status: 200 });
    });

  it("merges both feeds and shares one download per minute", async () => {
    const fetchMock = respond({ usgs: usgs, gdacs: gdacs });
    vi.stubGlobal("fetch", fetchMock);
    const first = await loadFeedEvents(0);
    const again = await loadFeedEvents(59_000);
    expect(first).toHaveLength(7);
    expect(again).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps going when one source is down, and fails only when both are", async () => {
    vi.stubGlobal("fetch", respond({ usgs: usgs }));
    expect(await loadFeedEvents(0)).toHaveLength(3);

    resetFeedCache();
    vi.stubGlobal("fetch", respond({}));
    await expect(loadFeedEvents(0)).rejects.toThrow("No live data source");
  });
});
