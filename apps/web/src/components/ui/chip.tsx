import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends ComponentProps<"button"> {
  pressed: boolean;
}

/** A toggle chip for filters. State is exposed through aria-pressed, not colour alone. */
function Chip({ pressed, className, type = "button", ...props }: ChipProps) {
  return (
    <button
      data-slot="chip"
      type={type}
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors max-md:h-11",
        pressed
          ? "border-primary bg-primary/15 text-foreground"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Chip };
