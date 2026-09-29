export const LAYER_IDS = [
  "events",
  "forecast",
  "population",
  "resources",
  "satellite",
  "weather",
  "roads",
] as const;
export type LayerId = (typeof LAYER_IDS)[number];

export interface LayerDef {
  id: LayerId;
  /** On when the app first loads (design doc 4.4: only Events). */
  defaultOn: boolean;
  /** False until the layer is built. The layers popover shows it disabled with a "Soon" hint. */
  available: boolean;
}

export const LAYER_DEFS: readonly LayerDef[] = [
  { id: "events", defaultOn: true, available: true },
  { id: "forecast", defaultOn: false, available: false }, // phase F4
  { id: "population", defaultOn: false, available: false }, // phase F3
  { id: "resources", defaultOn: false, available: false }, // phase F3
  { id: "satellite", defaultOn: false, available: false },
  { id: "weather", defaultOn: false, available: false },
  { id: "roads", defaultOn: false, available: true },
];

export function defaultLayerState(): Record<LayerId, boolean> {
  return Object.fromEntries(LAYER_DEFS.map((def) => [def.id, def.defaultOn])) as Record<
    LayerId,
    boolean
  >;
}
