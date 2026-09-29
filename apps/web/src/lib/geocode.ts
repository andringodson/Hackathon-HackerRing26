import type { Bbox } from "@/lib/geo";

/*
 * Place search with OpenStreetMap Nominatim: free, no key, and readable from the browser. The
 * public server allows about one request per second, so callers debounce (CommandPalette waits
 * 400 ms) and every query is cached for the session. Results must credit OpenStreetMap.
 */

export const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export interface Place {
  id: string;
  /** "Chennai" */
  name: string;
  /** "Tamil Nadu, India" */
  detail: string;
  lat: number;
  lng: number;
  bbox: Bbox | null;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  /** [south, north, west, east], as strings. */
  boundingbox?: string[];
}

export function parseNominatim(results: NominatimResult[]): Place[] {
  return results
    .map((r) => {
      const [first, ...rest] = r.display_name.split(", ");
      const bb = r.boundingbox?.map(Number);
      const bbox: Bbox | null =
        bb && bb.length === 4 && bb.every(Number.isFinite) ? [bb[2], bb[0], bb[3], bb[1]] : null;
      return {
        id: `place-${r.place_id}`,
        name: r.name || first,
        detail: (r.name && r.name !== first ? [first, ...rest] : rest).join(", "),
        lat: Number(r.lat),
        lng: Number(r.lon),
        bbox,
      };
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    // A city and its district often share the same label; showing both looks like a glitch.
    .filter((p, i, all) => all.findIndex((q) => q.name === p.name && q.detail === p.detail) === i);
}

const cache = new Map<string, Promise<Place[]>>();

/** Up to five places for the query, in the UI language where OpenStreetMap has names for it. */
export function searchPlaces(query: string, locale: string): Promise<Place[]> {
  const q = query.trim();
  const key = `${locale}:${q.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    limit: "5",
    "accept-language": locale,
  });
  const promise = fetch(`${NOMINATIM_URL}?${params}`)
    .then((response) => {
      if (!response.ok) throw new Error(`Nominatim ${response.status}`);
      return response.json() as Promise<NominatimResult[]>;
    })
    .then(parseNominatim);
  // A failed search is not cached, so trying again can work.
  promise.catch(() => cache.delete(key));
  cache.set(key, promise);
  return promise;
}

/** A zoom level that roughly fits the box: a country at about 3 to 4, a city at about 9 to 11. */
export function zoomForBbox([west, south, east, north]: Bbox): number {
  const span = Math.max(east - west, (north - south) * 1.6, 0.005);
  return Math.min(13, Math.max(3, Math.log2(360 / span)));
}
