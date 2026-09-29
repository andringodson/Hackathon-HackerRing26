"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ConfidenceBar } from "@/components/events/ConfidenceBar";
import { HazardIcon } from "@/components/events/HazardIcon";
import { SeverityBadge } from "@/components/events/SeverityBadge";
import { IconButton } from "@/components/ui/icon-button";
import { useNow } from "@/hooks/useNow";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatters";
import { clearSelection } from "@/store/actions";
import type { DisasterEvent } from "@/types/event";

/** Always visible at the top of the detail panel: what, where, when, how bad, how sure. */
export function EventHeader({ event }: { event: DisasterEvent }) {
  const t = useTranslations("detail");
  const locale = useLocale();
  const now = useNow(30_000);

  return (
    <header className="shrink-0 space-y-3 border-b p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-elevated">
          <HazardIcon type={event.type} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base leading-tight font-semibold">{event.title}</h2>
          <p className="text-xs text-muted-foreground">
            {event.place}
            {" · "}
            <time
              dateTime={event.occurredAt}
              title={formatAbsoluteTime(event.occurredAt, locale)}
              suppressHydrationWarning
            >
              {formatRelativeTime(event.occurredAt, locale, now)}
            </time>
          </p>
        </div>
        <IconButton label={t("close")} icon={X} tooltipSide="left" onClick={clearSelection} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <SeverityBadge severity={event.severity} />
        {event.status === "unverified" && (
          <span className="rounded-md border border-dashed px-1.5 py-0.5 text-xs font-medium">
            {t("unverified")}
          </span>
        )}
        {/* Official relays name their authority. Everything else is our own advisory. */}
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {event.official ? t("official", { authority: event.official.authority }) : t("advisory")}
        </span>
      </div>

      <ConfidenceBar
        value={event.confidence}
        sourceCount={event.sourceCount}
        reasoning={event.confidenceReasoning}
      />
    </header>
  );
}
