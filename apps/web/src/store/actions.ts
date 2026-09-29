import { useMapStore, type FocusRequest } from "@/store/map.store";
import { useUiStore } from "@/store/ui.store";

/*
 * Actions that have to move more than one store together. Keeping them here means the stores stay
 * independent of each other and components don't have to remember the pairing.
 */

/**
 * Select an event: open the detail panel, highlight the event, and fly to it if a target is given.
 *
 * The order matters. Opening the panel starts a short padding animation on the map; the fly-to then
 * takes over and carries the final padding with it (see components/map/storeSync.ts).
 */
export function selectEvent(id: string, focus?: FocusRequest) {
  useUiStore.getState().setRightOpen(true);
  useMapStore.getState().setSelected(id, focus);
}

/** Deselect and close the detail panel. Bound to the close button, Esc and clicks on empty map. */
export function clearSelection() {
  useMapStore.getState().setSelected(null);
  useUiStore.getState().setRightOpen(false);
}
