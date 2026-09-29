export const HAZARD_TYPES = ["earthquake", "flood", "cyclone", "wildfire", "landslide"] as const;
export type HazardType = (typeof HAZARD_TYPES)[number];

/**
 * Hazards that run for days (a storm, a flood, a fire): what matters is their last update. For a
 * quake or a landslide it is the moment it happened, even if a source revises it days later.
 */
export const ONGOING_HAZARDS: ReadonlySet<HazardType> = new Set(["cyclone", "flood", "wildfire"]);
