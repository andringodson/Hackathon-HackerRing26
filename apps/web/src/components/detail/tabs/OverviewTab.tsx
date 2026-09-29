"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatAbsoluteTime, formatCompactNumber } from "@/lib/formatters";
import { formatCoordinates } from "@/lib/geo";
import { ONGOING_HAZARDS } from "@/lib/hazards";
import type { DisasterEvent } from "@/types/event";

/** Plain-language summary, "What should I do?", impact numbers, and the key facts. */
export function OverviewTab({ event }: { event: DisasterEvent }) {
  const t = useTranslations("detail");
  const locale = useLocale();
  const { impact } = event;

  const stats = [
    { label: t("overview.peopleExposed"), value: impact?.peopleExposed },
    { label: t("overview.hospitals"), value: impact?.hospitalsInZone },
    { label: t("overview.shelters"), value: impact?.sheltersNearby },
  ].filter((stat): stat is { label: string; value: number } => stat.value !== undefined);

  const ongoing = ONGOING_HAZARDS.has(event.type);
  const facts = [
    event.magnitude != null && {
      label: t("facts.magnitude"),
      value: new Intl.NumberFormat(locale, { minimumFractionDigits: 1 }).format(event.magnitude),
    },
    {
      label: ongoing ? t("facts.started") : t("facts.occurred"),
      value: formatAbsoluteTime(event.occurredAt, locale),
    },
    { label: t("facts.updated"), value: formatAbsoluteTime(event.updatedAt, locale) },
    {
      label: t("facts.location"),
      value: formatCoordinates(event.location.lat, event.location.lng),
    },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  return (
    <div className="space-y-6">
      {event.summary && <p className="text-sm leading-relaxed">{event.summary}</p>}

      {event.guidance && event.guidance.length > 0 && (
        <section aria-labelledby="what-to-do" className="space-y-2.5">
          <h3 id="what-to-do" className="label-caps">
            {t("overview.whatToDo")}
          </h3>
          <ol className="space-y-2 text-sm">
            {event.guidance.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="numeric mt-px text-xs text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {stats.length > 0 && (
        <section aria-labelledby="impact" className="space-y-2.5">
          <h3 id="impact" className="label-caps">
            {t("overview.impact")}
          </h3>
          <dl className="grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border bg-elevated p-3">
                <dd className="numeric text-lg font-semibold">
                  {formatCompactNumber(stat.value, locale)}
                </dd>
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="facts" className="space-y-2.5">
        <h3 id="facts" className="label-caps">
          {t("facts.title")}
        </h3>
        <dl className="divide-y divide-border/60 rounded-lg border">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-baseline justify-between gap-4 px-3 py-2">
              <dt className="text-xs text-muted-foreground">{fact.label}</dt>
              <dd className="numeric text-right text-xs" suppressHydrationWarning>
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
