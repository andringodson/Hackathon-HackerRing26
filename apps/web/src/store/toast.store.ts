import { create } from "zustand";
import type { DisasterEvent } from "@/types/event";

/** At most this many toasts at once; the oldest goes first. */
export const MAX_TOASTS = 3;

export interface CriticalToast {
  id: string;
  title: string;
  place: string;
  lng: number;
  lat: number;
}

interface ToastState {
  toasts: CriticalToast[];
  /** Ids of critical events already known, so each one alerts once. Null until the first load. */
  seen: Set<string> | null;
  /** Feed the latest critical events: alerts on the ones that are new since the last call. */
  observe: (events: DisasterEvent[]) => void;
  dismiss: (id: string) => void;
}

/**
 * The critical-event toasts (design doc 4.5). The first observe() only learns what is already
 * there, so opening the app does not fire a burst of old alerts.
 */
export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  seen: null,
  observe: (events) => {
    const { seen, toasts } = get();
    const critical = events.filter((e) => e.severity === "critical");
    const fresh = seen ? critical.filter((e) => !seen.has(e.id)) : [];
    const nextSeen = new Set([...(seen ?? []), ...critical.map((e) => e.id)]);
    if (fresh.length === 0) {
      if (!seen || nextSeen.size !== seen.size) set({ seen: nextSeen });
      return;
    }
    const added = fresh.map((e) => ({
      id: e.id,
      title: e.title,
      place: e.place,
      lng: e.location.lng,
      lat: e.location.lat,
    }));
    set({ seen: nextSeen, toasts: [...toasts, ...added].slice(-MAX_TOASTS) });
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
