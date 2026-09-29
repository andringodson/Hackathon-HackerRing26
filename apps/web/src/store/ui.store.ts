import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LayoutMode } from "@/lib/layout";
import type { DetailTab } from "@/lib/roles";
import { applyTheme, resolveTheme, type Theme } from "@/lib/theme";

/**
 * Layout and chrome state (design doc 13.3). Components write here; the map never reads component
 * state, it follows this store through components/map/storeSync.ts.
 *
 * Locale is deliberately not here: next-intl owns it (NEXT_LOCALE cookie), so there is one source
 * of truth that the server can read too.
 */
interface UiState {
  leftOpen: boolean;
  rightOpen: boolean;
  activeTab: DetailTab;
  agentDrawerOpen: boolean;
  layersOpen: boolean;
  theme: Theme;
  /** Kept in step with the viewport width by AppShell. */
  layoutMode: LayoutMode;

  setLeftOpen: (open: boolean) => void;
  toggleLeft: () => void;
  setRightOpen: (open: boolean) => void;
  toggleRight: () => void;
  setActiveTab: (tab: DetailTab) => void;
  setAgentDrawerOpen: (open: boolean) => void;
  toggleAgentDrawer: () => void;
  setLayersOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** Adopts the theme the inline script already applied, or re-applies it. See useThemeSync. */
  syncTheme: () => void;
  setLayoutMode: (mode: LayoutMode) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      leftOpen: false,
      rightOpen: false,
      activeTab: "overview",
      agentDrawerOpen: false,
      layersOpen: false,
      theme: "dark",
      layoutMode: "desktop",

      // Both sidebars can be open only on large screens (design doc 2.4). Below that, opening
      // one closes the other.
      setLeftOpen: (open) =>
        set((s) => ({
          leftOpen: open,
          rightOpen: open && s.layoutMode !== "desktop" ? false : s.rightOpen,
        })),
      toggleLeft: () => get().setLeftOpen(!get().leftOpen),
      setRightOpen: (open) =>
        set((s) => ({
          rightOpen: open,
          leftOpen: open && s.layoutMode !== "desktop" ? false : s.leftOpen,
        })),
      toggleRight: () => get().setRightOpen(!get().rightOpen),

      setActiveTab: (activeTab) => set({ activeTab }),
      setAgentDrawerOpen: (agentDrawerOpen) => set({ agentDrawerOpen }),
      toggleAgentDrawer: () => set((s) => ({ agentDrawerOpen: !s.agentDrawerOpen })),
      setLayersOpen: (layersOpen) => set({ layersOpen }),

      setTheme: (theme) => {
        applyTheme(theme, { persist: true });
        set({ theme });
      },
      toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
      syncTheme: () => {
        const theme = resolveTheme();
        applyTheme(theme);
        set({ theme });
      },

      setLayoutMode: (layoutMode) =>
        set((s) => ({
          layoutMode,
          leftOpen: layoutMode !== "desktop" && s.leftOpen && s.rightOpen ? false : s.leftOpen,
        })),
    }),
    {
      name: "di-ui",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only the left panel is remembered. The right one follows the selected event, and the
      // theme has its own key so the inline script in <head> can read it.
      partialize: (s) => ({ leftOpen: s.leftOpen }),
      // Restored in a mount effect (see AppShell) so server and client render the same first frame.
      skipHydration: true,
    },
  ),
);
