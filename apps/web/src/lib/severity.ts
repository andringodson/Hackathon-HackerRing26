export const SEVERITIES = ["critical", "high", "moderate", "low", "info"] as const;
export type Severity = (typeof SEVERITIES)[number];

/** Higher is worse. */
export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  high: 3,
  moderate: 2,
  low: 1,
  info: 0,
};

/**
 * Mirrors --sev-* in styles/tokens.css. MapLibre cannot read CSS variables, so map layers need the
 * literal values. tokens.test.ts keeps the two in sync.
 */
export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  moderate: "#eab308",
  low: "#22c55e",
  info: "#3b82f6",
};

/** Marker outline weight in px. Critical is thick, so severity never depends on colour alone. */
export const SEVERITY_OUTLINE: Record<Severity, number> = {
  critical: 3,
  high: 2.5,
  moderate: 2,
  low: 1.5,
  info: 1,
};

export function compareSeverityDesc(a: Severity, b: Severity) {
  return SEVERITY_RANK[b] - SEVERITY_RANK[a];
}
