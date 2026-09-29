"use client";

import { TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { EventRow } from "@/components/events/EventRow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { useNow } from "@/hooks/useNow";
import { formatRelativeTime } from "@/lib/formatters";

/**
 * The event list: everything on the map, as a plain list. It is also the non-map way to reach all
 * the data (design doc 12), so it must keep working without the map.
 * TODO(F2): virtualize with TanStack Virtual, add "Load more", and highlight new rows for 3 s.
 */
export function LiveFeed() {
  const t = useTranslations("feed");
  const locale = useLocale();
  const { data, isPending, isError, refetch, dataUpdatedAt } = useLiveEvents();
  const now = useNow(30_000);

  if (isPending) return <FeedSkeleton />;

  const events = data ?? [];
  const checkedAt =
    dataUpdatedAt > 0
      ? t("checkedAt", { time: formatRelativeTime(dataUpdatedAt, locale, now) })
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
          <ul role="list" aria-label={t("count", { count: events.length })} className="divide-y">
            {events.map((event) => (
              <EventRow key={event.id} event={event} now={now} />
            ))}
          </ul>
        ) : (
          !isError && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
          )
        )}
      </div>

      {checkedAt && (
        <p className="border-t px-4 py-2 text-xs text-muted-foreground" suppressHydrationWarning>
          {checkedAt}
        </p>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="divide-y" aria-busy>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="mt-0.5 size-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
