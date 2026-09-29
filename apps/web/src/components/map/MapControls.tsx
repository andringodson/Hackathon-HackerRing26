"use client";

import { useState } from "react";
import { LocateFixed, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { LayerPopover } from "@/components/map/LayerPopover";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { useMapInstance } from "@/hooks/useMapInstance";
import { useMapStore } from "@/store/map.store";
import { useUiStore } from "@/store/ui.store";

const LOCATE_ZOOM = 9;

/**
 * Floating map controls. Layers and Filters sit bottom-left, zoom and locate bottom-right. Both
 * groups follow the sidebars through the --inset-* variables, so they are never covered by them.
 */
export function MapControls() {
  const t = useTranslations("map");
  const map = useMapInstance();
  const setLeftOpen = useUiStore((s) => s.setLeftOpen);
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        useMapStore.getState().focusOn({ lng: coords.longitude, lat: coords.latitude, zoom: LOCATE_ZOOM });
      },
      // TODO(F4): tell the user when location is denied or unavailable (needs the toast centre).
      () => setLocating(false),
      { timeout: 10_000 },
    );
  };

  return (
    <>
      <div className="fixed bottom-[calc(var(--inset-bottom)+56px)] left-[calc(var(--inset-left)+12px)] z-10 flex gap-2 transition-[left,bottom] duration-200 ease-out">
        <LayerPopover />
        <Button variant="ghost" className="glass" onClick={() => setLeftOpen(true)}>
          <SlidersHorizontal aria-hidden />
          {t("filters")}
        </Button>
      </div>

      <div className="fixed right-[calc(var(--inset-right)+12px)] bottom-[calc(var(--inset-bottom)+56px)] z-10 flex flex-col gap-2 transition-[right,bottom] duration-200 ease-out">
        <IconButton
          label={t("zoomIn")}
          icon={Plus}
          tooltipSide="left"
          className="glass"
          disabled={!map}
          onClick={() => map?.zoomIn()}
        />
        <IconButton
          label={t("zoomOut")}
          icon={Minus}
          tooltipSide="left"
          className="glass"
          disabled={!map}
          onClick={() => map?.zoomOut()}
        />
        <IconButton
          label={t("locate")}
          icon={LocateFixed}
          tooltipSide="left"
          className="glass"
          disabled={!map || locating}
          onClick={locate}
        />
      </div>
    </>
  );
}
