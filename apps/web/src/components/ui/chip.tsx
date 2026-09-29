import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends ComponentProps<"button"> {
  pressed: boolean;
}

/** A toggle chip for filters: a hairline that turns cyan when on. State is in aria-pressed, not colour alone. */
function Chip({ pressed, className, type = "button", ...props }: ChipProps) {
  return (
    <button
      data-slot="chip"
      type={type}
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-7 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors max-md:h-11",
        pressed
          ? "border-primary/60 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Chip };
