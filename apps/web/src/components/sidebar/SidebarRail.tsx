"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

/** The 48px strip a closed sidebar leaves behind. First button expands the panel; `children` are shortcuts. */
export function SidebarRail({
  side,
  expandLabel,
  onExpand,
  children,
}: {
  side: "left" | "right";
  expandLabel: string;
  onExpand: () => void;
  children?: ReactNode;
}) {
  const tooltipSide = side === "left" ? "right" : "left";
  return (
    <div className="flex h-full flex-col items-center gap-1 pt-3">
      <IconButton
        label={expandLabel}
        icon={side === "left" ? ChevronRight : ChevronLeft}
        tooltipSide={tooltipSide}
        onClick={onExpand}
      />
      <div aria-hidden className="my-1 h-px w-6 bg-border" />
      {children}
    </div>
  );
}
