import { describe, expect, it } from "vitest";
import { parseUrlState, serializeUrlState } from "@/lib/url-state";

describe("parseUrlState", () => {
  it("reads every field", () => {
    expect(
      parseUrlState("event=abc&layers=events,roads&t=6&lat=26.14&lng=92.93&z=7.5"),
    ).toEqual({
      event: "abc",
      layers: ["events", "roads"],
      t: 6,
      lat: 26.14,
      lng: 92.93,
      z: 7.5,
    });
  });

  it("returns an empty state for an empty query", () => {
    expect(parseUrlState("")).toEqual({});
  });

  it("drops layer ids it does not know", () => {
    expect(parseUrlState("layers=events,nonsense,roads").layers).toEqual(["events", "roads"]);
  });

  it("keeps an explicitly empty layer list, meaning all layers off", () => {
    expect(parseUrlState("layers=").layers).toEqual([]);
  });

  it("ignores garbage numbers instead of throwing", () => {
    expect(parseUrlState("t=abc&z=NaN&lat=x&lng=y")).toEqual({});
  });

  it("ignores out-of-range coordinates and zoom", () => {
    expect(parseUrlState("lat=91&lng=10&z=99")).toEqual({});
  });

  it("needs both lat and lng", () => {
    expect(parseUrlState("lat=10")).toEqual({});
  });

  it("accepts URLSearchParams", () => {
    expect(parseUrlState(new URLSearchParams({ event: "x" }))).toEqual({ event: "x" });
  });
});

describe("serializeUrlState", () => {
  it("round-trips", () => {
    const state = {
      event: "evt-1",
      layers: ["events" as const, "roads" as const],
      t: 12,
      lat: 26.1401,
      lng: 92.9301,
      z: 7.5,
    };
    expect(parseUrlState(serializeUrlState(state))).toEqual(state);
  });

  it("omits what is not set", () => {
    expect(serializeUrlState({})).toBe("");
    expect(serializeUrlState({ event: "a" })).toBe("event=a");
  });

  it("escapes event ids", () => {
    expect(parseUrlState(serializeUrlState({ event: "a&b=c" })).event).toBe("a&b=c");
  });
});
