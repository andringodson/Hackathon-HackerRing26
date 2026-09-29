"use client";

import { useEffect, useRef, useState } from "react";
import { useEvent } from "@/hooks/useEvent";
import { useMapInstance } from "@/hooks/useMapInstance";
import { EVENT_FOCUS_ZOOM } from "@/lib/geo";
import { parseUrlState, serializeUrlState } from "@/lib/url-state";
import { selectEvent } from "@/store/actions";
import { useMapStore } from "@/store/map.store";

/**
 * Keeps the selected event in the address bar (`/?event={id}`, design doc 7), so any view of an
 * event can be shared:
 * - on load, a link with ?event= selects that event and, once both the map and the event's data
 *   are ready, flies to it;
 * - afterwards, selecting and deselecting rewrites the URL in place (replaceState: no history
 *   entry per click, so Back still leaves the app).
 */
export function useSelectionUrl() {
  // Read once, on the client. It renders nothing, so server and client may differ here.
  const [linkedId] = useState(() =>
    typeof window === "undefined" ? null : (parseUrlState(window.location.search).event ?? null),
  );
  const map = useMapInstance();
  const { data: linked } = useEvent(linkedId);
  const focused = useRef(false);

  useEffect(() => {
    if (linkedId) selectEvent(linkedId);
  }, [linkedId]);

  useEffect(() => {
    if (focused.current || !map || !linked) return;
    focused.current = true;
    if (useMapStore.getState().selectedEventId !== linked.id) return; // user moved on already
    useMapStore.getState().focusOn({
      lng: linked.location.lng,
      lat: linked.location.lat,
      zoom: EVENT_FOCUS_ZOOM,
    });
  }, [map, linked]);

  useEffect(
    () =>
      useMapStore.subscribe((state, prev) => {
        if (state.selectedEventId === prev.selectedEventId) return;
        const params = new URLSearchParams(window.location.search);
        params.delete("event");
        const extra = params.toString();
        const own = serializeUrlState({ event: state.selectedEventId ?? undefined });
        const query = [own, extra].filter(Boolean).join("&");
        const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
        window.history.replaceState(window.history.state, "", url);
      }),
    [],
  );
}
