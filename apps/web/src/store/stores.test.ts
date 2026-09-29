import { beforeEach, describe, expect, it } from "vitest";
import { clearSelection, selectEvent } from "@/store/actions";
import { useFiltersStore } from "@/store/filters.store";
import { useMapStore } from "@/store/map.store";
import { useUiStore } from "@/store/ui.store";

beforeEach(() => {
  useUiStore.setState({
    leftOpen: false,
    rightOpen: false,
    agentDrawerOpen: false,
    layoutMode: "desktop",
  });
  useMapStore.setState({ selectedEventId: null, hoveredEventId: null, focusRequest: null });
  useFiltersStore.getState().reset();
});

describe("ui.store sidebars", () => {
  it("lets both sidebars be open on desktop", () => {
    const ui = useUiStore.getState();
    ui.setLeftOpen(true);
    ui.setRightOpen(true);
    expect(useUiStore.getState()).toMatchObject({ leftOpen: true, rightOpen: true });
  });

  it("opening one closes the other on tablet", () => {
    useUiStore.setState({ layoutMode: "tablet" });
    useUiStore.getState().setLeftOpen(true);
    useUiStore.getState().setRightOpen(true);
    expect(useUiStore.getState()).toMatchObject({ leftOpen: false, rightOpen: true });
    useUiStore.getState().setLeftOpen(true);
    expect(useUiStore.getState()).toMatchObject({ leftOpen: true, rightOpen: false });
  });

  it("closing never opens the other one", () => {
    useUiStore.setState({ layoutMode: "tablet", leftOpen: true });
    useUiStore.getState().setRightOpen(false);
    expect(useUiStore.getState()).toMatchObject({ leftOpen: true, rightOpen: false });
  });

  it("shrinking below desktop with both open keeps the detail panel", () => {
    useUiStore.setState({ leftOpen: true, rightOpen: true });
    useUiStore.getState().setLayoutMode("tablet");
    expect(useUiStore.getState()).toMatchObject({ leftOpen: false, rightOpen: true });
  });

  it("toggles", () => {
    useUiStore.getState().toggleLeft();
    expect(useUiStore.getState().leftOpen).toBe(true);
    useUiStore.getState().toggleLeft();
    expect(useUiStore.getState().leftOpen).toBe(false);
  });
});

describe("selecting events", () => {
  it("selectEvent opens the detail panel and asks the map to fly there", () => {
    selectEvent("evt-1", { lng: 92.9, lat: 26.1, zoom: 6 });
    expect(useMapStore.getState().selectedEventId).toBe("evt-1");
    expect(useMapStore.getState().focusRequest).toEqual({ lng: 92.9, lat: 26.1, zoom: 6 });
    expect(useUiStore.getState().rightOpen).toBe(true);
  });

  it("issues a fresh focus request each time, so re-selecting re-flies", () => {
    selectEvent("evt-1", { lng: 1, lat: 2 });
    const first = useMapStore.getState().focusRequest;
    selectEvent("evt-1", { lng: 1, lat: 2 });
    expect(useMapStore.getState().focusRequest).not.toBe(first);
  });

  it("selecting without a target does not move the map", () => {
    selectEvent("evt-1", { lng: 1, lat: 2 });
    selectEvent("evt-2");
    expect(useMapStore.getState().focusRequest).toBeNull();
  });

  it("clearSelection deselects and closes the panel", () => {
    selectEvent("evt-1", { lng: 1, lat: 2 });
    clearSelection();
    expect(useMapStore.getState().selectedEventId).toBeNull();
    expect(useUiStore.getState().rightOpen).toBe(false);
  });

  it("on tablet, selecting closes the feed to make room", () => {
    useUiStore.setState({ layoutMode: "tablet", leftOpen: true });
    selectEvent("evt-1");
    expect(useUiStore.getState()).toMatchObject({ leftOpen: false, rightOpen: true });
  });
});

describe("map.store layers", () => {
  it("starts with only Events on (design doc 4.4)", () => {
    const { layers } = useMapStore.getState();
    expect(layers.events).toBe(true);
    expect(Object.entries(layers).filter(([, on]) => on)).toHaveLength(1);
  });

  it("toggles a layer", () => {
    useMapStore.getState().toggleLayer("roads");
    expect(useMapStore.getState().layers.roads).toBe(true);
    useMapStore.getState().toggleLayer("roads");
    expect(useMapStore.getState().layers.roads).toBe(false);
  });
});

describe("filters.store", () => {
  it("toggles hazards and severities on and off", () => {
    const f = useFiltersStore.getState();
    f.toggleHazard("flood");
    f.toggleHazard("cyclone");
    expect(useFiltersStore.getState().hazards).toEqual(["flood", "cyclone"]);
    f.toggleHazard("flood");
    expect(useFiltersStore.getState().hazards).toEqual(["cyclone"]);
    f.toggleSeverity("critical");
    expect(useFiltersStore.getState().severities).toEqual(["critical"]);
  });

  it("resets to the defaults", () => {
    const f = useFiltersStore.getState();
    f.toggleHazard("flood");
    f.setTimeRange("7d");
    f.reset();
    expect(useFiltersStore.getState()).toMatchObject({ hazards: [], severities: [], timeRange: "24h" });
  });
});
