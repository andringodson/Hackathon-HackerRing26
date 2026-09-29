import { Activity, Flame, Mountain, Tornado, Waves, type LucideIcon } from "lucide-react";
import type { HazardType } from "@/lib/hazards";

/** One silhouette per hazard. Always shown next to a text label or inside a labelled control. */
export const HAZARD_ICONS: Record<HazardType, LucideIcon> = {
  earthquake: Activity,
  flood: Waves,
  cyclone: Tornado,
  wildfire: Flame,
  landslide: Mountain,
};

export function HazardIcon({ type, className }: { type: HazardType; className?: string }) {
  const Icon = HAZARD_ICONS[type];
  return <Icon aria-hidden className={className} />;
}
