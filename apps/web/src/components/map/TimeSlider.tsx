"use client";

import { useMapStore } from "@/store/map.store";

const MAX_HOURS = 72;

/**
 * Forecast time control, bottom centre of the map. It only appears while the Forecast layer is on
 * (design doc 4.5), and writes `forecastTime` (hours ahead) to map.store for the layer to follow.
 *
 * TODO(F4): translate the labels, add play and pause, and snap to the forecast's real time steps.
 */
export function TimeSlider() {
  const active = useMapStore((s) => s.layers.forecast);
  const hours = useMapStore((s) => s.forecastTime);
  const setHours = useMapStore((s) => s.setForecastTime);

  if (!active) return null;

  return (
    <div className="glass fixed bottom-[calc(var(--inset-bottom)+56px)] left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-lg px-4 py-2">
      <label htmlFor="forecast-time" className="text-xs whitespace-nowrap text-muted-foreground">
        +{hours}h
      </label>
      <input
        id="forecast-time"
        type="range"
        min={0}
        max={MAX_HOURS}
        step={1}
        value={hours}
        onChange={(event) => setHours(Number(event.target.value))}
        className="w-48 accent-[var(--accent)]"
      />
    </div>
  );
}
