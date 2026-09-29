"use client";

import { useLocale, useTranslations } from "next-intl";
import { SeverityIcon } from "@/components/events/SeverityBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { useNow } from "@/hooks/useNow";
import { USE_MOCKS } from "@/lib/env";
import { countBySeverity } from "@/lib/events";
import { formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

// Never wraps, and a touch smaller on phones so both pills fit beside the attribution button at 360px.
const PILL =
  "glass pointer-events-auto flex items-center rounded-lg px-3 py-1.5 whitespace-nowrap max-sm:px-2 max-sm:text-[11px]";

/**
 * Bottom strip: counts by severity on the left, data freshness on the right. It stops short of the
 * bottom-right corner, where the map's attribution control lives.
 *
 * "Active" means high, moderate or low. Info-level events are not counted.
 * TODO(F4): connection state from the WebSocket, and the "Data stale" banner when it drops.
 */
export function StatusStrip() {
  const t = useTranslations("status");
  const locale = useLocale();
  const { data, dataUpdatedAt, isError } = useLiveEvents();
  const now = useNow(1000);

  const counts = countBySeverity(data ?? []);
  const active = counts.high + counts.moderate + counts.low;
  const updated =
    dataUpdatedAt > 0 ? formatRelativeTime(dataUpdatedAt, locale, now) : null;

  const state = USE_MOCKS ? "demo" : isError ? "stale" : "live";
  const label =
    state === "demo"
      ? t("demo")
      : state === "stale"
        ? t("updated", { time: updated ?? "" })
        : updated
          ? `${t("live")} · ${updated}`
          : t("live");

  const pill = (
    <p
      tabIndex={state === "demo" ? 0 : undefined}
      className={cn(PILL, "numeric gap-2")}
      suppressHydrationWarning
    >
      {/* dot plus text: the state is never colour alone */}
      <span
        aria-hidden
        className={cn("size-2 rounded-full", state === "live" ? "bg-sev-low" : "bg-sev-moderate")}
      />
      {label}
    </p>
  );

  return (
    <div className="pointer-events-none fixed right-[calc(var(--inset-right)+56px)] bottom-[calc(var(--inset-bottom)+12px)] left-[calc(var(--inset-left)+12px)] z-10 flex items-center justify-between gap-2 text-xs transition-[left,right,bottom] duration-200 ease-out">
      <p className={cn(PILL, "numeric gap-3 max-sm:gap-2")}>
        <span className="flex items-center gap-1.5">
          <SeverityIcon severity="critical" className="size-3.5" />
          {t("critical", { count: counts.critical })}
        </span>
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
        <span className="flex items-center gap-1.5">
          <SeverityIcon severity="high" className="size-3.5" />
          {t("active", { count: active })}
        </span>
      </p>

      {state === "demo" ? (
        <Tooltip>
          <TooltipTrigger asChild>{pill}</TooltipTrigger>
          <TooltipContent side="top">{t("demoHint")}</TooltipContent>
        </Tooltip>
      ) : (
        pill
      )}
    </div>
  );
}
