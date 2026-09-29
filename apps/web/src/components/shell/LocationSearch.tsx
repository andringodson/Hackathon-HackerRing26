"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { SEARCH_INPUT_ID } from "@/lib/dom";

/**
 * Place search. Press "/" anywhere to focus it (useKeyboardShortcuts).
 * TODO(F2): geocode with Nominatim (1 request per second on the public server, so debounce and
 * cache aggressively) and fly the map to the chosen result.
 */
export function LocationSearch() {
  const t = useTranslations("topbar");
  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className="relative mx-auto w-full max-w-md min-w-0"
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={SEARCH_INPUT_ID}
        type="search"
        name="q"
        autoComplete="off"
        aria-label={t("searchLabel")}
        aria-keyshortcuts="/"
        placeholder={t("searchPlaceholder")}
        className="pl-9"
      />
      <kbd
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border px-1.5 font-mono text-[11px] text-muted-foreground max-md:hidden"
      >
        /
      </kbd>
    </form>
  );
}
