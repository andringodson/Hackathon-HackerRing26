/**
 * Public runtime config. NEXT_PUBLIC_* variables are inlined by Next at build time, so each one
 * must be referenced literally (no dynamic lookups). See .env.example.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "",
  mapStyleUrl:
    process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/dark",
} as const;

/** With no API configured the app runs on built-in demo data and says so in the UI. */
export const USE_MOCKS = env.apiUrl === "";
