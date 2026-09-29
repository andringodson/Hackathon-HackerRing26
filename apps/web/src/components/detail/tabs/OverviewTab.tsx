"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatCoordinates } from "@/lib/geo";
import { formatCompactNumber } from "@/lib/formatters";
import type { DisasterEvent } from "@/types/event";

/** Plain-language summary, "What should I do?", and impact numbers. */
export function OverviewTab({ event }: { event: DisasterEvent }) {
  const t = useTranslations("detail.overview");
  const locale = useLocale();
  const { impact } = event;

  const stats = [
    { label: t("peopleExposed"), value: impact?.peopleExposed },
    { label: t("hospitals"), value: impact?.hospitalsInZone },
    { label: t("shelters"), value: impact?.sheltersNearby },
  ].filter((stat): stat is { label: string; value: number } => stat.value !== undefined);

  return (
    <div className="space-y-6">
      {event.summary && <p className="text-sm leading-relaxed">{event.summary}</p>}

      {event.guidance && event.guidance.length > 0 && (
        <section aria-labelledby="what-to-do" className="space-y-2">
          <h3 id="what-to-do" className="text-sm font-semibold">
            {t("whatToDo")}
          </h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm marker:text-primary">
            {event.guidance.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>
      )}

      {stats.length > 0 && (
        <section aria-labelledby="impact" className="space-y-2">
          <h3 id="impact" className="text-sm font-semibold">
            {t("impact")}
          </h3>
          <dl className="grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg bg-elevated p-3">
                <dd className="text-lg font-semibold tabular-nums">
                  {formatCompactNumber(stat.value, locale)}
                </dd>
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      <p className="font-mono text-xs text-muted-foreground">
        {formatCoordinates(event.location.lat, event.location.lng)}
      </p>
    </div>
  );
}
