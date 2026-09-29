"use client";

import { useEffect, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { useShallow } from "zustand/react/shallow";
import { AgentDrawer } from "@/components/agents/AgentDrawer";
import { MapProvider } from "@/components/map/MapProvider";
import { MapControls } from "@/components/map/MapControls";
import { TimeSlider } from "@/components/map/TimeSlider";
import { BootScreen } from "@/components/shell/BootScreen";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { RoleProvider, useRole } from "@/components/shell/RoleProvider";
import { StatusStrip } from "@/components/shell/StatusStrip";
import { ToastCenter } from "@/components/shell/ToastCenter";
import { TopBar } from "@/components/shell/TopBar";
import { LeftSidebar } from "@/components/sidebar/LeftSidebar";
import { RightSidebar } from "@/components/sidebar/RightSidebar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useLayoutModeSync } from "@/hooks/useLayoutModeSync";
import { useSelectionUrl } from "@/hooks/useSelectionUrl";
import { useThemeSync } from "@/hooks/useThemeSync";
import { DRAWER_HEIGHT_RATIO, computeInsets } from "@/lib/layout";
import { canSeeAgentTools, type Role } from "@/lib/roles";
import { useUiStore } from "@/store/ui.store";

// The map library is large, so it loads on its own after the shell has painted.
const MapCanvas = dynamic(() => import("@/components/map/MapCanvas").then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => <div aria-hidden className="fixed inset-0 z-0 bg-background" />,
});

/**
 * The whole map screen: a full-viewport map with everything else floating above it (design doc
 * section 2). `/` renders it for the public and `/dashboard` for responders. The layout is the
 * same for every role; responders just get extra tabs and buttons.
 */
export function AppShell({ role = "public" }: { role?: Role }) {
  return (
    <RoleProvider role={role}>
      <MapProvider>
        <Shell />
      </MapProvider>
    </RoleProvider>
  );
}

// Separate from AppShell so these hooks can read the role from RoleProvider.
function Shell() {
  const role = useRole();
  useThemeSync();
  useLayoutModeSync();
  useKeyboardShortcuts();
  useSelectionUrl();

  // Restore the remembered sidebar state after mount. Doing it later than the first render keeps
  // the server HTML and the first client render identical.
  useEffect(() => {
    void useUiStore.persist.rehydrate();
  }, []);

  const layout = useUiStore(
    useShallow((s) => ({
      leftOpen: s.leftOpen,
      rightOpen: s.rightOpen,
      agentDrawerOpen: s.agentDrawerOpen,
      layoutMode: s.layoutMode,
    })),
  );

  // Floating UI (top bar, map controls, status strip, map attribution) reads --inset-* to stay
  // inside the part of the map that no panel covers. Sidebars overlay the map instead of resizing it.
  //
  // JS supplies the panel sizes (--panel-*); CSS turns them into insets and zeroes them below the
  // tablet breakpoint, where panels are sheets. Doing that in CSS means phones are right on the
  // first paint, instead of waiting for the layout mode to reach the store.
  const insets = computeInsets(layout, 0);
  const panelVars = {
    "--panel-left": `${insets.left}px`,
    "--panel-right": `${insets.right}px`,
    "--panel-bottom": layout.agentDrawerOpen ? `${DRAWER_HEIGHT_RATIO * 100}vh` : "0px",
  } as CSSProperties;

  return (
    <div
      style={panelVars}
      className={
        "contents [--inset-bottom:var(--panel-bottom)] [--inset-left:var(--panel-left)] [--inset-right:var(--panel-right)] " +
        "max-md:[--inset-bottom:0px] max-md:[--inset-left:0px] max-md:[--inset-right:0px]"
      }
    >
      <main>
        <MapCanvas />
      </main>
      <MapControls />
      <TimeSlider />
      <StatusStrip />
      <LeftSidebar />
      <RightSidebar />
      {canSeeAgentTools(role) && <AgentDrawer />}
      <TopBar />
      <ToastCenter />
      <CommandPalette />
      <BootScreen />
    </div>
  );
}
