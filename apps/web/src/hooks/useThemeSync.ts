"use client";

import { useLayoutEffect } from "react";
import { useUiStore } from "@/store/ui.store";

/**
 * The inline script in <head> puts the right theme on <html> before first paint. This keeps the
 * store in step with it and re-applies it on mount, because in development React's Strict Mode
 * remount resets <html> to the attributes it manages and would clear the theme
 * (node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md).
 * A layout effect runs before paint, so there is no flash.
 */
export function useThemeSync() {
  const syncTheme = useUiStore((s) => s.syncTheme);
  useLayoutEffect(() => {
    syncTheme();
  }, [syncTheme]);
}
