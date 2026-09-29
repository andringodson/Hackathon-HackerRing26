import type { ReactNode } from "react";

export type SheetSnap = "peek" | "half" | "full";

const HEIGHTS: Record<SheetSnap, string> = {
  peek: "96px",
  half: "50dvh",
  full: "calc(100dvh - 72px)",
};

/**
 * Placeholder for the mobile bottom sheet (design doc 9.1): peek 96px, half, full.
 * TODO(F7): make it draggable with snap points, and use it for the feed and detail panel below the
 * tablet breakpoint. Until then Sidebar falls back to a full-width sheet on phones.
 */
export function BottomSheet({
  snap,
  label,
  children,
}: {
  snap: SheetSnap;
  label: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      style={{ height: HEIGHTS[snap] }}
      className="fixed inset-x-0 bottom-0 z-20 overflow-hidden rounded-t-xl border-t bg-panel shadow-[var(--shadow-float)]"
    >
      {children}
    </section>
  );
}
