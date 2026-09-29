/**
 * Public runtime config. NEXT_PUBLIC_* variables are inlined by Next at build time, so each one
 * must be referenced literally (no dynamic lookups). See .env.example.
 */
const DEFAULT_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "",
  mapStyleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_MAP_STYLE_URL,
} as const;

/**
 * The default basemap's credits are known, so the app shows them in its own control
 * (components/map/MapCredits.tsx). Any other style gets MapLibre's attribution control, which
 * reads the credits from the style itself.
 */
export const OWN_MAP_CREDITS = env.mapStyleUrl === DEFAULT_MAP_STYLE_URL;

/**
 * Where events come from:
 * - "api": the DisasterIntel backend at NEXT_PUBLIC_API_URL, once it exists.
 * - "feeds" (default): public USGS and GDACS feeds read straight from the browser (lib/feeds).
 * - "demo": built-in sample events. Set NEXT_PUBLIC_DATA_SOURCE=demo; tests use it.
 */
export type DataSource = "api" | "feeds" | "demo";

export const DATA_SOURCE: DataSource = env.apiUrl
  ? "api"
  : process.env.NEXT_PUBLIC_DATA_SOURCE === "demo"
    ? "demo"
    : "feeds";

/** Sample data is on screen, and the UI says so. */
export const USE_MOCKS = DATA_SOURCE === "demo";
