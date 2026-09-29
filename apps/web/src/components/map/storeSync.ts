import type { Map as MapLibreMap, PaddingOptions } from "maplibre-gl";
import { computeInsets } from "@/lib/layout";
import { applyBasemapLayerVisibility } from "@/lib/map/style";
import { useMapStore, type FocusRequest } from "@/store/map.store";
import { useUiStore } from "@/store/ui.store";

const PADDING_ANIMATION_MS = 200;
const FLY_DURATION_MS = 600;

/** How much of the map is covered by panels right now, as MapLibre padding. */
function currentPadding(): PaddingOptions {
  const { leftOpen, rightOpen, agentDrawerOpen, layoutMode } = useUiStore.getState();
  const insets = computeInsets(
    { leftOpen, rightOpen, agentDrawerOpen, layoutMode },
    window.innerHeight,
  );
  return { left: insets.left, right: insets.right, top: 0, bottom: insets.bottom };
}

function flyToFocus(map: MapLibreMap, focus: FocusRequest) {
  map.flyTo({
    center: [focus.lng, focus.lat],
    // never zoom out to reach a target
    zoom: Math.max(map.getZoom(), focus.zoom ?? 0),
    // Carry the final padding: this interrupts the padding animation that opening the panel
    // started, and would otherwise leave it half done. MapLibre skips the motion itself when the
    // user prefers reduced motion.
    padding: currentPadding(),
    duration: FLY_DURATION_MS,
  });
}

function publishViewport(map: MapLibreMap) {
  const center = map.getCenter();
  const bounds = map.getBounds();
  useMapStore
    .getState()
    .setViewport({ lng: center.lng, lat: center.lat, zoom: map.getZoom() }, [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]);
}

/**
 * The adapter between the stores and MapLibre (design doc 13.3). Components change the stores;
 * this follows them and drives the map. It uses vanilla store subscriptions instead of hooks, so
 * none of it re-renders React and the map stays untouched when sidebars open and close.
 *
 * Call once, after the map's style has loaded. Returns a function that stops listening.
 * Data layers (events, forecast, ...) manage their own sources and follow the stores themselves.
 */
export function bindStoresToMap(map: MapLibreMap): () => void {
  map.setPadding(currentPadding());

  // Sidebars overlay the map, so shift its padding: what is "centred" is the visible part.
  const stopUi = useUiStore.subscribe((state, prev) => {
    if (
      state.leftOpen === prev.leftOpen &&
      state.rightOpen === prev.rightOpen &&
      state.agentDrawerOpen === prev.agentDrawerOpen &&
      state.layoutMode === prev.layoutMode
    ) {
      return;
    }
    map.easeTo({ padding: currentPadding(), duration: PADDING_ANIMATION_MS });
  });

  const stopMap = useMapStore.subscribe((state, prev) => {
    if (state.focusRequest && state.focusRequest !== prev.focusRequest) {
      flyToFocus(map, state.focusRequest);
    }
    if (state.layers.roads !== prev.layers.roads) {
      applyBasemapLayerVisibility(map, state.layers);
    }
  });

  const onMoveEnd = () => publishViewport(map);
  map.on("moveend", onMoveEnd);
  publishViewport(map);

  return () => {
    stopUi();
    stopMap();
    map.off("moveend", onMoveEnd);
  };
}
