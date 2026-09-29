"use client";

import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface IconButtonProps extends Omit<ComponentProps<typeof Button>, "children"> {
  /** Accessible name, also shown as the tooltip. Icon-only controls always need one. */
  label: string;
  icon: LucideIcon;
  tooltipSide?: ComponentProps<typeof TooltipContent>["side"];
}

/** An icon-only button with an accessible name and a tooltip. Used for rails, map controls and the top bar. */
export function IconButton({
  label,
  icon: Icon,
  tooltipSide = "bottom",
  size = "icon",
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label={label} size={size} {...props}>
          <Icon aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}
