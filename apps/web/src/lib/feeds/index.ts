import { loadGdacs } from "@/lib/feeds/gdacs";
import { loadUsgs } from "@/lib/feeds/usgs";
import type { DisasterEvent } from "@/types/event";

/*
 * Live events straight from public feeds, no backend. The feed list, the map viewport and the
 * detail panel all ask for events, often at once; they share one download per minute here and
 * filter it on the client (lib/events.ts).
 */

const FEEDS = [loadUsgs, loadGdacs];

/** USGS publishes every minute; there is no point asking more often. */
export const FEED_TTL_MS = 60_000;

let cache: { at: number; promise: Promise<DisasterEvent[]> } | null = null;

/** All feed events, from one shared download that is at most FEED_TTL_MS old. */
export function loadFeedEvents(now: number = Date.now()): Promise<DisasterEvent[]> {
  if (cache && now - cache.at < FEED_TTL_MS) return cache.promise;
  const promise = fetchAll();
  cache = { at: now, promise };
  // A failed download is not cached, so the next poll tries again.
  promise.catch(() => {
    if (cache?.promise === promise) cache = null;
  });
  return promise;
}

/** One source being down must not blank the map; only fail when nothing answered. */
async function fetchAll(): Promise<DisasterEvent[]> {
  const results = await Promise.allSettled(FEEDS.map((load) => load()));
  if (results.every((r) => r.status === "rejected")) {
    throw new Error("No live data source is reachable");
  }
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

/** For tests. */
export function resetFeedCache() {
  cache = null;
}
