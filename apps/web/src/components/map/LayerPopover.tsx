"use client";

import { Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { LAYER_DEFS } from "@/lib/map/layers";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/store/map.store";
import { useUiStore } from "@/store/ui.store";

/** Layer toggles. Opens with the Layers button or the "L" key; layers that are not built yet are shown disabled. */
export function LayerPopover() {
  const t = useTranslations();
  const open = useUiStore((s) => s.layersOpen);
  const setOpen = useUiStore((s) => s.setLayersOpen);
  const layers = useMapStore((s) => s.layers);
  const setLayer = useMapStore((s) => s.setLayer);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="glass">
          <Layers aria-hidden />
          {t("map.layers")}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start">
        <p className="mb-1 text-sm font-semibold">{t("map.layersTitle")}</p>
        <ul role="list" className="divide-y">
          {LAYER_DEFS.map((def) => (
            <li key={def.id} className="flex items-center justify-between gap-3 py-2">
              <label
                htmlFor={`layer-${def.id}`}
                className={cn("flex-1 text-sm", !def.available && "text-muted-foreground")}
              >
                {t(`layers.${def.id}`)}
                {!def.available && <span className="ml-2 text-xs">{t("map.soon")}</span>}
              </label>
              <Switch
                id={`layer-${def.id}`}
                checked={layers[def.id]}
                disabled={!def.available}
                onCheckedChange={(on) => setLayer(def.id, on)}
              />
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
