"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  side: "left" | "right";
  open: boolean;
  /** Width in px when open. */
  width: number;
  /** Accessible name for the panel. */
  label: string;
  /**
   * Content of the slim rail shown while the panel is closed (see SidebarRail). Leave out for a
   * panel that disappears completely when closed.
   */
  rail?: ReactNode;
  children: ReactNode;
}

/**
 * A side panel that overlays the map (design doc 2.5): it never resizes the map, so opening it
 * cannot make the map reflow. Closed panels are `inert`, so nothing in them can take focus or be
 * read out while they are off screen.
 *
 * Below the tablet breakpoint the panel becomes a full-width sheet under the top bar and the rail
 * is hidden. TODO(F7): swap that for the draggable BottomSheet.
 */
export function Sidebar({ side, open, width, label, rail, children }: SidebarProps) {
  const left = side === "left";
  return (
    <>
      {rail && (
        <div
          inert={open}
          className={cn(
            "fixed inset-y-0 z-[15] hidden w-12 border-border bg-panel md:block",
            left ? "left-0 border-r" : "right-0 border-l",
          )}
        >
          {rail}
        </div>
      )}
      <aside
        aria-label={label}
        inert={!open}
        data-side={side}
        data-state={open ? "open" : "closed"}
        style={{ width }}
        className={cn(
          "fixed inset-y-0 z-20 flex max-w-full flex-col bg-panel",
          "transition-transform duration-200 ease-out",
          left ? "left-0 border-r" : "right-0 border-l",
          open
            ? "translate-x-0 shadow-[var(--shadow-float)]"
            : left
              ? "-translate-x-full"
              : "translate-x-full",
          // `!` beats the inline width above
          "max-md:top-[72px] max-md:rounded-t-xl max-md:border-t max-md:w-full!",
        )}
      >
        {children}
      </aside>
    </>
  );
}

/** Title row for a panel. Put the collapse or close button in `children`. */
export function SidebarHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b pr-2 pl-4 max-md:h-14">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </div>
  );
}
