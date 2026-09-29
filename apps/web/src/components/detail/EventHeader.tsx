"use client";

import { useState } from "react";
import { Check, Crosshair, ExternalLink, Link2, X, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ConfidenceBar } from "@/components/events/ConfidenceBar";
import { HazardIcon } from "@/components/events/HazardIcon";
import { SeverityBadge } from "@/components/events/SeverityBadge";
import { IconButton } from "@/components/ui/icon-button";
import { useNow } from "@/hooks/useNow";
import { activityTime } from "@/lib/events";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatters";
import { formatCoordinates } from "@/lib/geo";
import { ONGOING_HAZARDS } from "@/lib/hazards";
import type { Severity } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { clearSelection } from "@/store/actions";
import type { DisasterEvent } from "@/types/event";

// Static strings so Tailwind can see every class.
const TILE: Record<Severity, string> = {
  critical: "border-sev-critical/60 text-sev-critical",
  high: "border-sev-high/60 text-sev-high",
  moderate: "border-sev-moderate/60 text-sev-moderate",
  low: "border-sev-low/60 text-sev-low",
  info: "border-sev-info/60 text-sev-info",
};

/**
 * Always visible at the top of the detail panel: what, where, when, how bad, how sure, and the
 * actions (share, copy coordinates, open the source).
 */
export function EventHeader({ event }: { event: DisasterEvent }) {
  const t = useTranslations("detail");
  const locale = useLocale();
  const now = useNow(15_000);
  const ongoing = ONGOING_HAZARDS.has(event.type);
  const at = activityTime(event);
  const when = formatRelativeTime(at, locale, Math.max(now, at));
  const sourceUrl = event.sources?.find((s) => s.url)?.url;

  return (
    <header className="shrink-0 space-y-3.5 border-b p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg border bg-elevated",
            TILE[event.severity],
          )}
        >
          <HazardIcon type={event.type} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base leading-tight font-semibold text-balance">{event.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {event.place}
            {" · "}
            <time
              dateTime={new Date(at).toISOString()}
              title={formatAbsoluteTime(at, locale)}
              className="numeric"
              suppressHydrationWarning
            >
              {ongoing ? t("updatedAgo", { time: when }) : when}
            </time>
          </p>
        </div>
        <IconButton label={t("close")} icon={X} tooltipSide="left" onClick={clearSelection} />
      </div>

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <SeverityBadge severity={event.severity} />
        {event.status === "unverified" && (
          <span className="rounded-md border border-dashed px-1.5 py-0.5 text-xs font-medium">
            {t("unverified")}
          </span>
        )}
        {/* Official relays name their authority. Everything else is an advisory. */}
        <span className="label-caps">
          {event.official ? t("official", { authority: event.official.authority }) : t("advisory")}
        </span>
      </div>

      <ConfidenceBar
        value={event.confidence}
        sourceCount={event.sourceCount}
        reasoning={event.confidenceReasoning}
      />

      <div className="flex flex-wrap gap-1.5">
        <CopyAction icon={Link2} label={t("actions.copyLink")} value={() => eventLink(event.id)} />
        <CopyAction
          icon={Crosshair}
          label={t("actions.copyCoordinates")}
          value={() => formatCoordinates(event.location.lat, event.location.lng)}
        />
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noreferrer" className={ACTION}>
            <ExternalLink aria-hidden className="size-3.5" />
            {t("actions.openSource")}
          </a>
        )}
      </div>
    </header>
  );
}

const ACTION =
  "inline-flex h-7 items-center whitespace-nowrap gap-1.5 rounded-md border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground max-md:h-10";

/** A link that opens the app with this event selected (see hooks/useSelectionUrl.ts). */
function eventLink(id: string) {
  const url = new URL(window.location.href);
  url.search = new URLSearchParams({ event: id }).toString();
  url.hash = "";
  return url.toString();
}

/** Copies a value and confirms in place for 1.5 s. The confirmation is announced politely. */
function CopyAction({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: () => string;
}) {
  const t = useTranslations("detail.actions");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (insecure context or denied): nothing sensible to do.
    }
  };

  return (
    <button type="button" onClick={copy} className={cn(ACTION, copied && "text-primary")}>
      {copied ? (
        <Check aria-hidden className="size-3.5" />
      ) : (
        <Icon aria-hidden className="size-3.5" />
      )}
      <span aria-live="polite">{copied ? t("copied") : label}</span>
    </button>
  );
}
