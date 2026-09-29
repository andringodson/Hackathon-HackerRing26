export const LOCALES = ["en", "ta", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** next-intl's conventional cookie name. Read on the server (request.ts), written by LanguageMenu. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** `native` is shown in the language menu in the language's own script. */
export const LOCALE_LABELS: Record<Locale, { native: string; short: string }> = {
  en: { native: "English", short: "EN" },
  ta: { native: "தமிழ்", short: "TA" },
  hi: { native: "हिन्दी", short: "HI" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
