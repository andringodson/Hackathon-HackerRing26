// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseNominatim, searchPlaces, zoomForBbox } from "@/lib/geocode";

// Real Nominatim answer for "Chennai" (29 Sep 2026), trimmed.
const CHENNAI = {
  place_id: 1,
  display_name: "Chennai, Tamil Nadu, India",
  name: "Chennai",
  lat: "13.0836939",
  lon: "80.2701860",
  boundingbox: ["12.8519771", "13.2351580", "80.1401875", "80.3328982"],
};

describe("parseNominatim", () => {
  it("splits the name from the rest and reorders the box to west, south, east, north", () => {
    const [place] = parseNominatim([CHENNAI]);
    expect(place).toMatchObject({ name: "Chennai", detail: "Tamil Nadu, India", lat: 13.0836939 });
    expect(place.bbox).toEqual([80.1401875, 12.8519771, 80.3328982, 13.235158]);
  });

  it("keeps one of several results with the same label", () => {
    expect(parseNominatim([CHENNAI, { ...CHENNAI, place_id: 2, lat: "13.0008" }])).toHaveLength(1);
  });

  it("drops results without usable coordinates", () => {
    expect(parseNominatim([{ ...CHENNAI, lat: "x" }])).toEqual([]);
  });
});

describe("zoomForBbox", () => {
  it("zooms a city close and a country far", () => {
    expect(zoomForBbox([80.14, 12.85, 80.33, 13.24])).toBeGreaterThan(8.5);
    expect(zoomForBbox([68, 6, 98, 36])).toBeLessThan(4);
  });
});

describe("searchPlaces", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks once per query and language, and caches the answer", async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(
      async () => new Response(JSON.stringify([CHENNAI])),
    );
    vi.stubGlobal("fetch", fetchMock);
    const first = await searchPlaces("Chennai ", "en");
    const again = await searchPlaces("chennai", "en");
    expect(first[0].name).toBe("Chennai");
    expect(again).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("accept-language=en");
  });
});
