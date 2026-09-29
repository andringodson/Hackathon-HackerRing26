"use client";

import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { EventRow } from "@/components/events/EventRow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { useNow } from "@/hooks/useNow";
import { DATA_SOURCE } from "@/lib/env";
import { formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useFiltersStore, useHasActiveFilters } from "@/store/filters.store";

/** Names of the live sources, shown in the footer (they are proper nouns, not translated). */
const FEED_SOURCES = "USGS · GDACS";

/**
 * The event list: everything on the map, as a plain list. It is also the non-map way to reach all
 * the data (design doc 12), so it must keep working without the map.
 * TODO(F2): virtualize with TanStack Virtual and add "Load more".
 */
export function LiveFeed() {
  const t = useTranslations("feed");
  const locale = useLocale();
  const { data, isPending, isError, refetch, dataUpdatedAt } = useLiveEvents();
  const now = useNow(10_000);
  const listRef = useNewRowHighlight(data);

  if (isPending) return <FeedSkeleton />;

  const events = data ?? [];
  // `now` ticks every 10 s, so the data can be newer than it; never show "in 2 sec.".
  const checkedAt =
    dataUpdatedAt > 0
      ? t("checkedAt", {
          time: formatRelativeTime(dataUpdatedAt, locale, Math.max(now, dataUpdatedAt)),
        })
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isError && (
        <div
          role="alert"
          className="flex items-start gap-2 border-b bg-sev-moderate/10 px-4 py-3 text-xs"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-sev-moderate" />
          <p className="flex-1">{t("error")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("retry")}
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {events.length > 0 ? (
          <ul
            ref={listRef}
            role="list"
            aria-label={t("count", { count: events.length })}
            className="divide-y divide-border/60"
          >
            {events.map((event) => (
              <EventRow key={event.id} event={event} now={now} />
            ))}
          </ul>
        ) : (
          !isError && <EmptyFeed />
        )}
      </div>

      {checkedAt && (
        <div className="flex items-center gap-2 border-t px-4 py-2 text-[11px] text-muted-foreground">
          <span
            aria-hidden
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              isError || DATA_SOURCE === "demo" ? "bg-sev-moderate" : "live-dot bg-sev-low",
            )}
          />
          <p className="numeric truncate" suppressHydrationWarning>
            {checkedAt}
          </p>
          <p className="ml-auto shrink-0">
            {DATA_SOURCE === "feeds"
              ? FEED_SOURCES
              : DATA_SOURCE === "demo"
                ? t("sampleData")
                : null}
          </p>
        </div>
      )}
    </div>
  );
}

/** Nothing matches: say so calmly, and offer the two ways out. */
function EmptyFeed() {
  const t = useTranslations();
  const { timeRange, setTimeRange, reset } = useFiltersStore(
    useShallow((s) => ({ timeRange: s.timeRange, setTimeRange: s.setTimeRange, reset: s.reset })),
  );
  const hasActive = useHasActiveFilters();

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">{t("feed.empty")}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {timeRange !== "7d" && (
          <Button variant="outline" size="sm" onClick={() => setTimeRange("7d")}>
            {t("feed.widen")}
          </Button>
        )}
        {hasActive && (
          <Button variant="ghost" size="sm" onClick={reset}>
            {t("filters.clear")}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Marks rows that arrive on a refresh (not on first load or a filter change) with data-new, which
 * plays a 3 s cyan fade (design doc 5.4). Works on the DOM from an effect, so rendering stays pure.
 */
function useNewRowHighlight(events: { id: string }[] | undefined) {
  const listRef = useRef<HTMLUListElement>(null);
  const seen = useRef<Set<string> | null>(null);
  const filterKey = useFiltersStore((s) => `${s.timeRange}|${s.hazards}|${s.severities}`);
  const lastKey = useRef(filterKey);

  useEffect(() => {
    if (!events) return;
    const ids = events.map((e) => e.id);
    const sameView = lastKey.current === filterKey;
    if (seen.current && sameView) {
      for (const id of ids) {
        if (seen.current.has(id)) continue;
        listRef.current
          ?.querySelector(`[data-event-id="${CSS.escape(id)}"]`)
          ?.setAttribute("data-new", "");
      }
    }
    lastKey.current = filterKey;
    seen.current = new Set([...(sameView ? (seen.current ?? []) : []), ...ids]);
  }, [events, filterKey]);

  return listRef;
}

function FeedSkeleton() {
  return (
    <div className="divide-y divide-border/60" aria-busy>
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="flex items-start gap-2.5 py-3 pr-3 pl-4">
          <Skeleton className="mt-0.5 size-4 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between gap-6">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-6" />
            </div>
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
