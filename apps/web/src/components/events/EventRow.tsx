"use client";

import { useLocale, useTranslations } from "next-intl";
import { ConfidenceDot } from "@/components/events/ConfidenceBar";
import { HazardIcon } from "@/components/events/HazardIcon";
import { SeverityIcon } from "@/components/events/SeverityBadge";
import { EVENT_FOCUS_ZOOM } from "@/lib/geo";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { selectEvent } from "@/store/actions";
import { useMapStore } from "@/store/map.store";
import type { DisasterEvent } from "@/types/event";

/**
 * One row in the live feed. Hovering or focusing it highlights the marker on the map; clicking
 * selects the event, which flies the map there and opens the detail panel.
 */
export function EventRow({ event, now }: { event: DisasterEvent; now: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const selected = useMapStore((s) => s.selectedEventId === event.id);
  const hovered = useMapStore((s) => s.hoveredEventId === event.id);
  const hoverEvent = useMapStore((s) => s.hoverEvent);
  const unverified = event.status === "unverified";

  return (
    <li>
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
          "flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors hover:bg-accent max-md:py-3.5",
          selected ? "border-l-primary bg-accent" : "border-l-transparent",
          hovered && !selected && "bg-accent",
          // Unverified events (responders only) get a dashed edge, so they never look confirmed.
          unverified && "border-dashed border-l-sev-moderate",
        )}
      >
        <SeverityIcon severity={event.severity} className="mt-0.5 size-5" />
        <span className="sr-only">{t(`severity.${event.severity}`)}</span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <HazardIcon type={event.type} className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{event.title}</span>
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {event.place}
            {" · "}
            <time
              dateTime={event.occurredAt}
              title={formatAbsoluteTime(event.occurredAt, locale)}
              suppressHydrationWarning
            >
              {formatRelativeTime(event.occurredAt, locale, now)}
            </time>
            {unverified && (
              <>
                {" · "}
                <span className="font-medium text-foreground">{t("detail.unverified")}</span>
              </>
            )}
          </span>
        </span>

        <ConfidenceDot value={event.confidence} />
      </button>
    </li>
  );
}
