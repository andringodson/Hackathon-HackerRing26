"use client";

import { useLocale, useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatAbsoluteTime, formatPercent, formatRelativeTime } from "@/lib/formatters";
import type { DisasterEvent, EventSource } from "@/types/event";

/** Where the confidence score comes from: each source, how reliable it is, and how well it agrees with the rest. */
export function SourcesTab({ event }: { event: DisasterEvent }) {
  const t = useTranslations("detail.sources");
  const sources = event.sources ?? [];

  if (sources.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("none")}</p>;
  }

  return (
    <ul role="list" className="space-y-3">
      {sources.map((source) => (
        <SourceItem key={source.id} source={source} />
      ))}
    </ul>
  );
}

function SourceItem({ source }: { source: EventSource }) {
  const t = useTranslations("detail.sources");
  const locale = useLocale();

  return (
    <li className="space-y-2 rounded-lg bg-elevated p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <span className="truncate">{source.name}</span>
          {source.stale && (
            <Tooltip>
              <TooltipTrigger asChild>
                {/* amber dot for a source that has stopped updating (design doc 10.3) */}
                <span
                  role="img"
                  tabIndex={0}
                  aria-label={t("stale")}
                  className="size-2 shrink-0 rounded-full bg-sev-moderate"
                />
              </TooltipTrigger>
              <TooltipContent>{t("stale")}</TooltipContent>
            </Tooltip>
          )}
        </p>
        <time
          dateTime={source.reportedAt}
          title={formatAbsoluteTime(source.reportedAt, locale)}
          className="shrink-0 text-xs text-muted-foreground"
          suppressHydrationWarning
        >
          {formatRelativeTime(source.reportedAt, locale)}
        </time>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <Score label={t("reliability")} value={source.reliability} locale={locale} />
        <Score label={t("agreement")} value={source.agreement} locale={locale} />
      </dl>
    </li>
  );
}

function Score({ label, value, locale }: { label: string; value: number; locale: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="font-medium tabular-nums">{formatPercent(value, locale)}</dd>
      </div>
      <div aria-hidden className="h-1 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}
