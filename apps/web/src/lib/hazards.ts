export const HAZARD_TYPES = ["earthquake", "flood", "cyclone", "wildfire", "landslide"] as const;
export type HazardType = (typeof HAZARD_TYPES)[number];
