"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type SheetSnap = "half" | "full";

const SHEET_HEIGHT: Record<SheetSnap, string> = {
  half: "50dvh",
  // Below the floating top bar.
  full: "calc(100dvh - 72px)",
};

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
  /** Closes the panel. On phones, dragging the sheet down past a third of the screen calls it. */
  onDismiss?: () => void;
  children: ReactNode;
}

/**
 * A side panel that overlays the map (design doc 2.5): it never resizes the map, so opening it
 * cannot make the map reflow. Closed panels are `inert`, so nothing in them can take focus or be
 * read out while they are off screen.
 *
 * Below the tablet breakpoint the panel is a bottom sheet (design doc 9.1): it opens at half height
 * so the map and the selected event stay visible above it (lib/layout.ts pads the map for it), and
 * its handle drags it to full height or down to close. The rail is hidden there.
 */
export function Sidebar({ side, open, width, label, rail, onDismiss, children }: SidebarProps) {
  const left = side === "left";
  const [snap, setSnap] = useState<SheetSnap>("half");
  // A panel that closes reopens at half height ("adjusting state when a prop changes").
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setSnap("half");
  }

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
        style={{ width, "--sheet-h": SHEET_HEIGHT[snap] } as CSSProperties}
        className={cn(
          "fixed inset-y-0 z-20 flex max-w-full flex-col bg-panel",
          "transition-[translate,height] duration-200 ease-out data-dragging:transition-none",
          left ? "left-0 border-r" : "right-0 border-l",
          open
            ? "translate-x-0 shadow-[var(--shadow-float)]"
            : left
              ? "-translate-x-full"
              : "translate-x-full",
          // Phones: a bottom sheet. `!` beats the inline width above.
          "max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:h-(--sheet-h) max-md:w-full!",
          "max-md:translate-x-0 max-md:rounded-t-2xl max-md:border-x-0 max-md:border-t",
          !open && "max-md:translate-y-full",
        )}
      >
        {onDismiss && (
          <SheetHandle snap={snap} onSnap={setSnap} onDismiss={onDismiss} />
        )}
        {children}
      </aside>
    </>
  );
}

/** Movement in px before a press on the handle counts as a drag rather than a tap. */
const DRAG_SLOP = 4;

/**
 * The grab bar on top of a phone sheet. Drag to resize: let go above 70% of the screen for full
 * height, below 30% to close, otherwise half. Tap (or Enter/Space) toggles half and full.
 */
function SheetHandle({
  snap,
  onSnap,
  onDismiss,
}: {
  snap: SheetSnap;
  onSnap: (snap: SheetSnap) => void;
  onDismiss: () => void;
}) {
  const t = useTranslations("sidebar");
  const drag = useRef<{ el: HTMLElement; y: number; height: number; moved: boolean } | null>(null);
  const skipClick = useRef(false);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    const el = e.currentTarget.closest("aside");
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { el, y: e.clientY, height: el.getBoundingClientRect().height, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.abs(dy) < DRAG_SLOP) return;
    d.moved = true;
    d.el.dataset.dragging = "";
    const max = window.innerHeight - 72;
    d.el.style.height = `${Math.min(max, Math.max(0, d.height - dy))}px`;
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    skipClick.current = true;
    const share = d.el.getBoundingClientRect().height / window.innerHeight;
    delete d.el.dataset.dragging;
    d.el.style.height = "";
    if (share < 0.3) onDismiss();
    else onSnap(share > 0.7 ? "full" : "half");
  };

  return (
    <button
      type="button"
      aria-label={snap === "full" ? t("sheetShrink") : t("sheetExpand")}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={() => {
        if (skipClick.current) {
          skipClick.current = false;
          return;
        }
        onSnap(snap === "full" ? "half" : "full");
      }}
      className="flex h-6 w-full shrink-0 touch-none items-center justify-center md:hidden"
    >
      <span aria-hidden className="h-1 w-10 rounded-full bg-muted-foreground/40" />
    </button>
  );
}

/**
 * Title row for a panel: a small-caps label, optional `meta` beside it (a count, a live dot), and
 * the collapse or close button in `children`.
 */
export function SidebarHeader({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b pr-2 pl-4 max-md:h-14">
      <div className="flex min-w-0 items-center gap-2.5">
        <h2 className="label-caps text-foreground">{title}</h2>
        {meta}
      </div>
      {children}
    </div>
  );
}
