export const LEFT_WIDTH = 320;
export const RIGHT_WIDTH = 400;
export const RAIL_WIDTH = 48;
/** Agent drawer height as a share of the viewport. */
export const DRAWER_HEIGHT_RATIO = 0.3;

export const BREAKPOINT_TABLET = 768;
export const BREAKPOINT_DESKTOP = 1280;

export type LayoutMode = "mobile" | "tablet" | "desktop";

export function layoutModeForWidth(width: number): LayoutMode {
  if (width >= BREAKPOINT_DESKTOP) return "desktop";
  if (width >= BREAKPOINT_TABLET) return "tablet";
  return "mobile";
}

export interface LayoutState {
  leftOpen: boolean;
  rightOpen: boolean;
  agentDrawerOpen: boolean;
  layoutMode: LayoutMode;
}

/** How much of each map edge is covered by overlay UI, in px. */
export interface Insets {
  left: number;
  right: number;
  bottom: number;
}

/**
 * Sidebars overlay the map rather than resizing it, so the map needs to know how much of it is
 * covered. The result drives both MapLibre's padding (so a selected event centres in the visible
 * area) and the CSS insets that keep floating controls clear of the panels.
 *
 * The closed left sidebar leaves a slim rail. On mobile, panels become full-width sheets and the
 * map keeps its full area.
 */
export function computeInsets(state: LayoutState, viewportHeight: number): Insets {
  if (state.layoutMode === "mobile") return { left: 0, right: 0, bottom: 0 };
  return {
    left: state.leftOpen ? LEFT_WIDTH : RAIL_WIDTH,
    right: state.rightOpen ? RIGHT_WIDTH : 0,
    bottom: state.agentDrawerOpen ? Math.round(viewportHeight * DRAWER_HEIGHT_RATIO) : 0,
  };
}
