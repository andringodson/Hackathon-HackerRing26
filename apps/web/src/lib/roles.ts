export const ROLES = ["public", "responder", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const DETAIL_TABS = [
  "overview",
  "forecast",
  "resources",
  "sources",
  "alert",
  "trace",
] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];

const PUBLIC_TABS: readonly DetailTab[] = ["overview", "forecast", "resources", "sources"];

/** Four tabs for the public, six for responders and admins (design doc 3.2). */
export function tabsForRole(role: Role): readonly DetailTab[] {
  return role === "public" ? PUBLIC_TABS : DETAIL_TABS;
}

/** Agent drawer and trace tab. */
export function canSeeAgentTools(role: Role) {
  return role !== "public";
}

/** Unverified and watchlist events are for responders only. */
export function canSeeUnverified(role: Role) {
  return role !== "public";
}
