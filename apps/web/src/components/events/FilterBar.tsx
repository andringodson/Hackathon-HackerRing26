"use client";

import { useLocale, useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { HAZARD_ICONS } from "@/components/events/HazardIcon";
import { SeverityIcon } from "@/components/events/SeverityBadge";
import { Chip } from "@/components/ui/chip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { FILTER_CHIP_ATTR } from "@/lib/dom";
import { countBySeverity } from "@/lib/events";
import { HAZARD_TYPES } from "@/lib/hazards";
import { SEVERITIES, type Severity } from "@/lib/severity";
import { TIME_RANGES } from "@/lib/time-range";
import { cn } from "@/lib/utils";
import { useFiltersStore, useHasActiveFilters } from "@/store/filters.store";

const chipProps = { [FILTER_CHIP_ATTR]: "" };

// Static strings so Tailwind can see every class.
const SEVERITY_FILL: Record<Severity, string> = {
  critical: "bg-sev-critical",
  high: "bg-sev-high",
  moderate: "bg-sev-moderate",
  low: "bg-sev-low",
  info: "bg-sev-info",
};

/**
 * Filters in three compact rows: time range as a segmented control, hazards as icon toggles, and
 * the severity mix as a bar whose legend doubles as the severity toggles. They apply to the list
 * and the map at once.
 */
export function FilterBar() {
  const t = useTranslations();
  const { hazards, severities, timeRange, toggleHazard, toggleSeverity, setTimeRange, reset } =
    useFiltersStore(useShallow((s) => s));
  const hasActive = useHasActiveFilters();

  return (
    <div className="space-y-2.5 border-b px-4 pt-3 pb-3.5">
      <div className="flex h-5 items-center justify-between">
        <p className="label-caps">{t("sidebar.filters")}</p>
        {hasActive && (
          <button
            type="button"
            onClick={reset}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            {t("filters.clear")}
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label={t("filters.timeRange")}
        className="grid grid-cols-4 overflow-hidden rounded-md border"
      >
        {TIME_RANGES.map((range, i) => (
          <button
            key={range}
            type="button"
            {...(i === 0 ? chipProps : {})}
            aria-pressed={timeRange === range}
            onClick={() => setTimeRange(range)}
            className={cn(
              "numeric h-7 text-xs transition-colors max-md:h-11",
              i > 0 && "border-l",
              timeRange === range
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`filters.range.${range}`)}
          </button>
        ))}
      </div>

      <div role="group" aria-label={t("filters.hazard")} className="grid grid-cols-5 gap-1.5">
        {HAZARD_TYPES.map((hazard) => {
          const Icon = HAZARD_ICONS[hazard];
          const label = t(`hazard.${hazard}`);
          return (
            <Tooltip key={hazard}>
              <TooltipTrigger asChild>
                <Chip
                  pressed={hazards.includes(hazard)}
                  onClick={() => toggleHazard(hazard)}
                  aria-label={label}
                  className="px-0"
                >
                  <Icon aria-hidden className="size-3.5" />
                </Chip>
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <SeverityScale selected={severities} onToggle={toggleSeverity} />
    </div>
  );
}

/**
 * The severity mix of what the other filters let through, as one thin stacked bar, with a legend
 * of toggles underneath (shape, count). Counts ignore the severity filter itself, so a toggle
 * shows what it would add. With some severities selected, the others fade in the bar.
 */
function SeverityScale({
  selected,
  onToggle,
}: {
  selected: Severity[];
  onToggle: (severity: Severity) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { data } = useLiveEvents({ allSeverities: true });
  const counts = countBySeverity(data ?? []);
  const total = SEVERITIES.reduce((sum, s) => sum + counts[s], 0);
  const active = (s: Severity) => selected.length === 0 || selected.includes(s);
  const number = new Intl.NumberFormat(locale);

  return (
    <div role="group" aria-label={t("filters.severity")} className="space-y-1.5">
      <div aria-hidden className="flex h-1 gap-px overflow-hidden rounded-full bg-border">
        {total > 0 &&
          SEVERITIES.filter((s) => counts[s] > 0).map((s) => (
            <span
              key={s}
              style={{ flexGrow: counts[s] }}
              className={cn(
                "min-w-1 transition-opacity",
                SEVERITY_FILL[s],
                !active(s) && "opacity-20",
              )}
            />
          ))}
      </div>
      <div className="grid grid-cols-5 gap-1">
        {SEVERITIES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={selected.includes(s)}
            aria-label={`${t(`severity.${s}`)}: ${number.format(counts[s])}`}
            title={t(`severity.${s}`)}
            onClick={() => onToggle(s)}
            className={cn(
              "flex h-7 items-center justify-center gap-1 rounded-md border text-[11px] transition-colors max-md:h-11",
              selected.includes(s)
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            <SeverityIcon severity={s} className="size-3" />
            <span className="numeric">{number.format(counts[s])}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
