"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { AttributionControl, Map as MapLibreMap } from "maplibre-gl";
import { useTranslations } from "next-intl";
import { MapLayers } from "@/components/map/layers/MapLayers";
import { bindStoresToMap } from "@/components/map/storeSync";
import { useRegisterMap } from "@/hooks/useMapInstance";
import { env, OWN_MAP_CREDITS } from "@/lib/env";
import { DEFAULT_BOUNDS } from "@/lib/geo";
import { applyBasemapTweaks } from "@/lib/map/style";
import { useMapStore } from "@/store/map.store";

/**
 * Owns the MapLibre instance. Always mounted, so it never reloads when sidebars open and close.
 * This component renders one <div> and never re-renders because of UI state: the stores drive the
 * map through the adapter in storeSync.ts, and data layers follow the stores themselves.
 *
 * Load it with next/dynamic and ssr: false (see AppShell) so the map library stays out of the
 * initial bundle.
 */
export function MapCanvas() {
  const t = useTranslations("map");
  const containerRef = useRef<HTMLDivElement>(null);
  const register = useRegisterMap();
  // Layers mount only after the style has loaded, so they can add sources immediately.
  const [map, setMap] = useState<MapLibreMap | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const instance = new MapLibreMap({
      container,
      style: env.mapStyleUrl,
      bounds: DEFAULT_BOUNDS,
      // Room for the top bar above and the status strip below.
      fitBoundsOptions: { padding: { top: 80, bottom: 80, left: 24, right: 24 } },
      minZoom: 2,
      maxZoom: 18,
      // A flat 2D map: no accidental rotation or tilt.
      dragRotate: false,
      pitchWithRotate: false,
      // Added by hand after load instead (see below).
      attributionControl: false,
    });
    instance.touchZoomRotate.disableRotation();

    // The OpenFreeMap style asks for a sprite image its sprite sheet does not contain, which logs a
    // warning on every render. A transparent pixel stands in for any missing image.
    instance.on("styleimagemissing", ({ id }) => {
      if (!instance.hasImage(id)) {
        instance.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) });
      }
    });

    let unbind: (() => void) | undefined;
    let disposed = false;
    instance.once("load", () => {
      if (disposed) return;
      // The attribution is a licence requirement for OpenStreetMap data. The default basemap's
      // credits live in MapCredits, above the map UI. A custom style gets MapLibre's control as a
      // small (i) button; MapLibre starts a compact control expanded until the first interaction,
      // so collapse it now. It is added here, not in the constructor, so the expanded state is
      // never on screen.
      if (!OWN_MAP_CREDITS) {
        instance.addControl(new AttributionControl({ compact: true }), "bottom-right");
        const attribution = container.querySelector(".maplibregl-ctrl-attrib");
        attribution?.removeAttribute("open");
        attribution?.classList.remove("maplibregl-compact-show");
      }
      applyBasemapTweaks(instance, useMapStore.getState().layers);
      unbind = bindStoresToMap(instance);
      register(instance);
      setMap(instance);
    });

    return () => {
      disposed = true;
      unbind?.();
      register(null);
      setMap(null);
      instance.remove();
    };
  }, [register]);

  return (
    <div role="region" aria-label={t("label")} className="fixed inset-0 z-0 bg-background">
      {/* MapLibre sets position: relative on its container, so it gets its own element. */}
      <div ref={containerRef} className="size-full" />
      {map && <MapLayers map={map} />}
    </div>
  );
}
