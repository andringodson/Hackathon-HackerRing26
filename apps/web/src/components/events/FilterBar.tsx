"use client";

import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { HAZARD_ICONS } from "@/components/events/HazardIcon";
import { SeverityIcon } from "@/components/events/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FILTER_CHIP_ATTR } from "@/lib/dom";
import { HAZARD_TYPES } from "@/lib/hazards";
import { SEVERITIES } from "@/lib/severity";
import { TIME_RANGES } from "@/lib/time-range";
import { useFiltersStore, useHasActiveFilters } from "@/store/filters.store";

const chipProps = { [FILTER_CHIP_ATTR]: "" };

/** Time range, hazard and severity chips. They apply to the list and the map at once. */
export function FilterBar() {
  const t = useTranslations();
  const { hazards, severities, timeRange, toggleHazard, toggleSeverity, setTimeRange, reset } =
    useFiltersStore(useShallow((s) => s));
  const hasActive = useHasActiveFilters();

  return (
    <div className="space-y-3 border-b px-4 py-3">
      <Group label={t("filters.timeRange")}>
        {TIME_RANGES.map((range) => (
          <Chip
            key={range}
            {...chipProps}
            pressed={timeRange === range}
            onClick={() => setTimeRange(range)}
          >
            {t(`filters.range.${range}`)}
          </Chip>
        ))}
      </Group>

      <Group label={t("filters.hazard")}>
        {HAZARD_TYPES.map((hazard) => {
          const Icon = HAZARD_ICONS[hazard];
          return (
            <Chip
              key={hazard}
              {...chipProps}
              pressed={hazards.includes(hazard)}
              onClick={() => toggleHazard(hazard)}
            >
              <Icon aria-hidden className="size-3.5" />
              {t(`hazard.${hazard}`)}
            </Chip>
          );
        })}
      </Group>

      <Group label={t("filters.severity")}>
        {SEVERITIES.map((severity) => (
          <Chip
            key={severity}
            {...chipProps}
            pressed={severities.includes(severity)}
            onClick={() => toggleSeverity(severity)}
          >
            <SeverityIcon severity={severity} className="size-3.5" />
            {t(`severity.${severity}`)}
          </Chip>
        ))}
      </Group>

      {hasActive && (
        <Button variant="ghost" size="sm" onClick={reset} className="-ml-2.5">
          {t("filters.clear")}
        </Button>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
