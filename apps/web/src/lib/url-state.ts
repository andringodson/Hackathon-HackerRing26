import { LAYER_IDS, type LayerId } from "@/lib/map/layers";

/**
 * The shareable subset of app state: `?event=&layers=&t=&lat=&lng=&z=` (design doc section 7).
 * Phase F2 wires this to the stores and the address bar; the parsing lives here so it can be
 * tested on its own.
 */
export interface UrlState {
  event?: string;
  /** Layers that are switched on. */
  layers?: LayerId[];
  /** Forecast time, hours ahead. */
  t?: number;
  lat?: number;
  lng?: number;
  z?: number;
}

function toNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Tolerant on purpose: a hand-edited or stale link should degrade, not throw. */
export function parseUrlState(input: string | URLSearchParams): UrlState {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const state: UrlState = {};

  const event = params.get("event");
  if (event) state.event = event;

  const layers = params.get("layers");
  if (layers !== null) {
    state.layers = layers
      .split(",")
      .filter((id): id is LayerId => (LAYER_IDS as readonly string[]).includes(id));
  }

  const t = toNumber(params.get("t"));
  if (t !== undefined) state.t = t;

  const lat = toNumber(params.get("lat"));
  const lng = toNumber(params.get("lng"));
  if (lat !== undefined && lng !== undefined && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    state.lat = lat;
    state.lng = lng;
  }

  const z = toNumber(params.get("z"));
  if (z !== undefined && z >= 0 && z <= 24) state.z = z;

  return state;
}

/** Returns a query string without the leading "?". */
export function serializeUrlState(state: UrlState): string {
  const params = new URLSearchParams();
  if (state.event) params.set("event", state.event);
  if (state.layers) params.set("layers", state.layers.join(","));
  if (state.t !== undefined) params.set("t", String(state.t));
  if (state.lat !== undefined && state.lng !== undefined) {
    params.set("lat", state.lat.toFixed(4));
    params.set("lng", state.lng.toFixed(4));
  }
  if (state.z !== undefined) params.set("z", state.z.toFixed(2));
  return params.toString();
}
