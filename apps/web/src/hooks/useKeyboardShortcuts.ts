"use client";

import { useEffect } from "react";
import { FILTER_CHIP_ATTR } from "@/lib/dom";
import { canSeeAgentTools } from "@/lib/roles";
import { useRole } from "@/components/shell/RoleProvider";
import { clearSelection } from "@/store/actions";
import { useMapStore } from "@/store/map.store";
import { useUiStore } from "@/store/ui.store";

const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

/**
 * Global shortcuts (design doc 10.1). Mounted once by AppShell.
 * TODO(F2): left/right arrows for previous/next event in the feed.
 */
export function useKeyboardShortcuts() {
  const role = useRole();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd+K toggles the command palette from anywhere, even while typing.
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const ui = useUiStore.getState();
        ui.setCommandOpen(!ui.commandOpen);
        return;
      }

      // Radix calls preventDefault when Esc closes one of its own layers (menus, popovers), so
      // this also stops one Esc press from closing a menu and deselecting the event.
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;

      const ui = useUiStore.getState();

      if (event.key === "Escape") {
        // Close the top-most thing: the agent drawer first, then the selected event.
        if (ui.agentDrawerOpen) ui.setAgentDrawerOpen(false);
        else if (useMapStore.getState().selectedEventId) clearSelection();
        return;
      }

      // Plain keys must not fire while someone is typing.
      if ((event.target as HTMLElement | null)?.closest(EDITABLE)) return;

      switch (event.key) {
        case "[":
          ui.toggleLeft();
          break;
        case "]":
          ui.toggleRight();
          break;
        case "/":
          event.preventDefault();
          ui.setCommandOpen(true);
          break;
        case "l":
        case "L":
          ui.setLayersOpen(true);
          break;
        case "f":
        case "F":
          ui.setLeftOpen(true);
          // Wait for the panel to lose `inert` before moving focus into it.
          requestAnimationFrame(() =>
            document.querySelector<HTMLElement>(`[${FILTER_CHIP_ATTR}]`)?.focus(),
          );
          break;
        case "a":
        case "A":
          if (canSeeAgentTools(role)) ui.toggleAgentDrawer();
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [role]);
}
