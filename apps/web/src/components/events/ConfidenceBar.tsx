"use client";

import { useLocale, useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/** Confidence (0 to 1) with the source count, and the verification reasoning on hover or focus. */
export function ConfidenceBar({
  value,
  sourceCount,
  reasoning,
}: {
  value: number;
  sourceCount: number;
  reasoning?: string;
}) {
  const t = useTranslations("detail");
  const locale = useLocale();
  const percent = formatPercent(value, locale);

  const content = (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{t("confidence")}</span>
        <span className="numeric font-medium">{percent}</span>
      </div>
      <div
        role="meter"
        aria-label={t("confidence")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-valuetext={percent}
        className="h-1.5 overflow-hidden rounded-full bg-border"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${value * 100}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{t("sourcesVerified", { count: sourceCount })}</p>
    </div>
  );

  if (!reasoning) return content;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* focusable so keyboard users can reach the reasoning too */}
        <div tabIndex={0} className="rounded-md">
          {content}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">{reasoning}</TooltipContent>
    </Tooltip>
  );
}

/** Compact confidence for list rows: a small ring filled to the confidence, and the percentage. */
export function ConfidenceRing({ value, className }: { value: number; className?: string }) {
  const t = useTranslations("feed");
  const locale = useLocale();
  const percent = formatPercent(value, locale);
  const label = t("confidence", { value: percent });
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("inline-flex shrink-0 items-center gap-1", className)}
    >
      <svg viewBox="0 0 16 16" aria-hidden className="size-3 -rotate-90">
        <circle cx={8} cy={8} r={6} fill="none" strokeWidth={2.5} className="stroke-border" />
        <circle
          cx={8}
          cy={8}
          r={6}
          fill="none"
          strokeWidth={2.5}
          pathLength={100}
          strokeDasharray={`${Math.round(value * 100)} 100`}
          className="stroke-primary"
        />
      </svg>
      <span aria-hidden className="numeric text-[11px]">
        {percent}
      </span>
    </span>
  );
}
