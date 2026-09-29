"use client";

import { useSyncExternalStore } from "react";
import {
  BREAKPOINT_DESKTOP,
  BREAKPOINT_TABLET,
  layoutModeForWidth,
  type LayoutMode,
} from "@/lib/layout";

/** Live result of a CSS media query. `serverSnapshot` is what the server render assumes. */
export function useMediaQuery(query: string, serverSnapshot = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverSnapshot,
  );
}

const DESKTOP_QUERY = `(min-width: ${BREAKPOINT_DESKTOP}px)`;
const TABLET_QUERY = `(min-width: ${BREAKPOINT_TABLET}px)`;

function subscribeToLayoutMode(onChange: () => void) {
  const lists = [window.matchMedia(DESKTOP_QUERY), window.matchMedia(TABLET_QUERY)];
  lists.forEach((mql) => mql.addEventListener("change", onChange));
  return () => lists.forEach((mql) => mql.removeEventListener("change", onChange));
}

/**
 * mobile / tablet / desktop from the viewport width. Returns a string, so components re-render
 * when a breakpoint is crossed, not on every resize.
 */
export function useLayoutMode(): LayoutMode {
  return useSyncExternalStore(
    subscribeToLayoutMode,
    () => layoutModeForWidth(window.innerWidth),
    () => "desktop",
  );
}
