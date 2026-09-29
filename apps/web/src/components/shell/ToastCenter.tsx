"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { OctagonAlert, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { eventKeys, fetchEvents } from "@/lib/api/events";
import { USE_MOCKS } from "@/lib/env";
import { EVENT_FOCUS_ZOOM } from "@/lib/geo";
import { selectEvent } from "@/store/actions";
import { useToastStore, type CriticalToast } from "@/store/toast.store";
import type { EventFilters } from "@/types/event";

/** Critical events from the last day, whatever the feed filters are: an alert must not hide. */
const CRITICAL: EventFilters = {
  hazards: [],
  severities: ["critical"],
  timeRange: "24h",
  bbox: null,
  includeUnverified: false,
};
const POLL_INTERVAL_MS = 30_000;
const TOAST_MS = 15_000;

/**
 * The one thing allowed to grab attention on its own: "New critical event: … [View]" (design doc
 * 4.5), announced politely to screen readers. The live region is always mounted, because screen
 * readers only announce changes inside a region that already exists.
 */
export function ToastCenter() {
  const t = useTranslations("toast");
  const toasts = useToastStore((s) => s.toasts);
  const { data } = useQuery({
    queryKey: eventKeys.list(CRITICAL),
    queryFn: ({ signal }) => fetchEvents(CRITICAL, signal),
    refetchInterval: USE_MOCKS ? false : POLL_INTERVAL_MS,
  });

  useEffect(() => {
    if (data) useToastStore.getState().observe(data);
  }, [data]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      aria-label={t("region")}
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-3"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast }: { toast: CriticalToast }) {
  const t = useTranslations("toast");
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), TOAST_MS);
    return () => clearTimeout(timer);
  }, [dismiss, toast.id]);

  return (
    <div className="glass pointer-events-auto relative flex w-[min(92vw,420px)] animate-[popover-in_200ms_ease-out] items-center gap-3 overflow-hidden rounded-lg py-2.5 pr-2 pl-4">
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-sev-critical" />
      <OctagonAlert aria-hidden className="size-5 shrink-0 text-sev-critical" />
      <div className="min-w-0 flex-1">
        <p className="label-caps text-sev-critical">{t("newCritical")}</p>
        <p className="truncate text-sm font-medium">
          {toast.title}
          {toast.place && <span className="text-muted-foreground"> · {toast.place}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          dismiss(toast.id);
          selectEvent(toast.id, { lng: toast.lng, lat: toast.lat, zoom: EVENT_FOCUS_ZOOM });
        }}
        className="h-7 shrink-0 rounded-md border border-sev-critical/60 px-2.5 text-xs font-medium hover:bg-sev-critical/15"
      >
        {t("view")}
      </button>
      <button
        type="button"
        aria-label={t("dismiss")}
        onClick={() => dismiss(toast.id)}
        className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
