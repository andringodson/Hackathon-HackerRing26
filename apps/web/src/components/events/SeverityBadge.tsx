"use client";

import { Circle, CircleAlert, Diamond, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Severity } from "@/lib/severity";
import { cn } from "@/lib/utils";

// Severity is never colour alone: each level also has its own shape, and critical gets a thick outline.
const SEVERITY_ICONS: Record<Severity, LucideIcon> = {
  critical: OctagonAlert,
  high: TriangleAlert,
  moderate: Diamond,
  low: Circle,
  info: CircleAlert,
};

// Static strings so Tailwind can see every class.
const ICON_COLOR: Record<Severity, string> = {
  critical: "text-sev-critical",
  high: "text-sev-high",
  moderate: "text-sev-moderate",
  low: "text-sev-low",
  info: "text-sev-info",
};

const BADGE_STYLE: Record<Severity, string> = {
  critical: "border-2 border-sev-critical bg-sev-critical/15",
  high: "border border-sev-high bg-sev-high/15",
  moderate: "border border-sev-moderate bg-sev-moderate/15",
  low: "border border-sev-low bg-sev-low/15",
  info: "border border-sev-info bg-sev-info/15",
};

/** The severity shape in its colour. Decorative: put a text label next to it, or use SeverityBadge. */
export function SeverityIcon({ severity, className }: { severity: Severity; className?: string }) {
  const Icon = SEVERITY_ICONS[severity];
  return <Icon aria-hidden className={cn("size-4 shrink-0", ICON_COLOR[severity], className)} />;
}

/** Icon, label and colour together. The label stays in the normal text colour so it passes contrast in both themes. */
export function SeverityBadge({
  severity,
  iconOnly = false,
  className,
}: {
  severity: Severity;
  iconOnly?: boolean;
  className?: string;
}) {
  const t = useTranslations("severity");
  const label = t(severity);
  return (
    <span
      data-severity={severity}
      role={iconOnly ? "img" : undefined}
      aria-label={iconOnly ? label : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-foreground",
        BADGE_STYLE[severity],
        className,
      )}
    >
      <SeverityIcon severity={severity} className="size-3.5" />
      {!iconOnly && label}
    </span>
  );
}
