"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUiStore } from "@/store/ui.store";

/**
 * Looks like a search box and opens the command palette, which searches places (OpenStreetMap),
 * live events and actions in one place. Also opened by "/" and Ctrl/Cmd+K (useKeyboardShortcuts).
 */
export function LocationSearch() {
  const t = useTranslations("topbar");
  const setOpen = useUiStore((s) => s.setCommandOpen);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-keyshortcuts="/ Control+K Meta+K"
      className="relative mx-auto flex h-9 w-full max-w-md min-w-0 items-center gap-2.5 rounded-md border bg-transparent pr-2 pl-3 text-left text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 max-md:h-11"
    >
      <Search aria-hidden className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{t("searchPlaceholder")}</span>
      <kbd
        aria-hidden
        className="numeric shrink-0 rounded border px-1.5 text-[11px] leading-5 max-md:hidden"
      >
        Ctrl K
      </kbd>
    </button>
  );
}
