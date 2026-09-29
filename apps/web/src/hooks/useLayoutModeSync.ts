"use client";

import { useEffect } from "react";
import { useLayoutMode } from "@/hooks/useMediaQuery";
import { useUiStore } from "@/store/ui.store";

/** Mirrors the viewport-derived layout mode into the UI store, where the map adapter can see it. */
export function useLayoutModeSync() {
  const mode = useLayoutMode();
  const setLayoutMode = useUiStore((s) => s.setLayoutMode);
  useEffect(() => {
    setLayoutMode(mode);
  }, [mode, setLayoutMode]);
}
