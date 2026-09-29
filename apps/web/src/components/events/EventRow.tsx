"use client";

import { RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ConfidenceRing } from "@/components/events/ConfidenceBar";
import { HazardIcon } from "@/components/events/HazardIcon";
import { SeverityIcon } from "@/components/events/SeverityBadge";
import { EVENT_FOCUS_ZOOM } from "@/lib/geo";
import { ONGOING_HAZARDS } from "@/lib/hazards";
import { formatAbsoluteTime, formatAge } from "@/lib/formatters";
import type { Severity } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { selectEvent } from "@/store/actions";
import { useMapStore } from "@/store/map.store";
import type { DisasterEvent } from "@/types/event";

// Static strings so Tailwind can see every class.
const STRIP: Record<Severity, string> = {
  critical: "border-sev-critical",
  high: "border-sev-high",
  moderate: "border-sev-moderate",
  low: "border-sev-low",
  info: "border-sev-info",
};

/**
 * One row in the live feed:
 *
 *   ┃ ◆ M4.7 Earthquake                           5h
 *   ┃   ∿ 100 km W of Petrolia, CA            ◔ 95%
 *
 * A severity-coloured edge, the severity shape (never colour alone), title and age on top, hazard,
 * place and confidence below. Hovering or focusing it highlights the marker; clicking selects the
 * event, which flies the map there and opens the detail panel.
 */
export function EventRow({ event, now }: { event: DisasterEvent; now: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const selected = useMapStore((s) => s.selectedEventId === event.id);
  const hovered = useMapStore((s) => s.hoveredEventId === event.id);
  const hoverEvent = useMapStore((s) => s.hoverEvent);
  const unverified = event.status === "unverified";
  // Ongoing hazards show their last update; the rest when they happened (see activityTime).
  const ongoing = ONGOING_HAZARDS.has(event.type);
  const shownAt = ongoing ? event.updatedAt : event.occurredAt;
  const timeTitle = ongoing
    ? `${t("feed.updated")} ${formatAbsoluteTime(event.updatedAt, locale)} · ${formatAbsoluteTime(event.occurredAt, locale)}`
    : formatAbsoluteTime(event.occurredAt, locale);

  return (
    <li data-event-id={event.id} className="feed-row">
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={() =>
          selectEvent(event.id, {
            lng: event.location.lng,
            lat: event.location.lat,
            zoom: EVENT_FOCUS_ZOOM,
          })
        }
        onMouseEnter={() => hoverEvent(event.id)}
        onMouseLeave={() => hoverEvent(null)}
        onFocus={() => hoverEvent(event.id)}
        onBlur={() => hoverEvent(null)}
        className={cn(
          "relative flex w-full items-start gap-2.5 py-2.5 pr-3 pl-4 text-left transition-colors hover:bg-elevated max-md:py-3.5",
          selected && "bg-primary/[0.07]",
          hovered && !selected && "bg-elevated",
        )}
      >
        {/* Unverified events (responders only) get a dashed edge, so they never look confirmed. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-1.5 left-0 border-l-[3px]",
            STRIP[event.severity],
            unverified && "border-dashed opacity-70",
          )}
        />
        <SeverityIcon severity={event.severity} className="mt-0.5 size-4" />
        <span className="sr-only">{t(`severity.${event.severity}`)}</span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className={cn("truncate text-[13px] font-medium", selected && "text-primary")}>
              {event.title}
            </span>
            <time
              dateTime={shownAt}
              title={timeTitle}
              className="numeric ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"
              suppressHydrationWarning
            >
              {ongoing && (
                <>
                  <RefreshCw aria-hidden className="size-2.5" />
                  <span className="sr-only">{t("feed.updated")}</span>
                </>
              )}
              {formatAge(shownAt, locale, now)}
            </time>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <HazardIcon type={event.type} className="size-3 shrink-0" />
            <span className="truncate">{event.place}</span>
            {unverified && (
              <span className="shrink-0 font-medium text-foreground">{t("detail.unverified")}</span>
            )}
            <ConfidenceRing value={event.confidence} className="ml-auto pl-2" />
          </span>
        </span>
      </button>
    </li>
  );
}
