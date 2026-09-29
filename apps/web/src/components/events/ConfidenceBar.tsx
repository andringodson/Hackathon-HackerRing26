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
        <span className="font-medium tabular-nums">{percent}</span>
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

/** Compact confidence for list rows: the fill level says high, medium or low, and the label has the number. */
export function ConfidenceDot({ value }: { value: number }) {
  const t = useTranslations("feed");
  const locale = useLocale();
  const label = t("confidence", { value: formatPercent(value, locale) });
  const level = value >= 0.85 ? "high" : value >= 0.6 ? "medium" : "low";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "mt-1.5 inline-block size-2.5 shrink-0 rounded-full border border-primary",
        level === "high" && "bg-primary",
        level === "medium" && "bg-primary/40",
      )}
    />
  );
}
