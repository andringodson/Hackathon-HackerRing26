const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["day", DAY],
  ["hour", HOUR],
  ["minute", MINUTE],
  ["second", 1000],
];

/** "2 min. ago", "in 3 hr." Localized. Pair with formatAbsoluteTime for the hover title. */
export function formatRelativeTime(
  value: Date | string | number,
  locale: string,
  now: number = Date.now(),
) {
  const diff = new Date(value).getTime() - now;
  const abs = Math.abs(diff);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  for (const [unit, size] of UNITS) {
    if (abs >= size || unit === "second") return formatter.format(Math.round(diff / size), unit);
  }
  return "";
}

export function formatAbsoluteTime(value: Date | string | number, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

/** Compact and localized: 1,200,000 is "1.2M" in English. Hindi and Tamil use their own digits and units. */
export function formatCompactNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

/** 0.923 becomes "92%". */
export function formatPercent(fraction: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(
    fraction,
  );
}
