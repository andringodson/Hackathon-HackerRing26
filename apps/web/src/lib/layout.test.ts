import { describe, expect, it } from "vitest";
import {
  LEFT_WIDTH,
  RAIL_WIDTH,
  RIGHT_WIDTH,
  computeInsets,
  layoutModeForWidth,
  type LayoutState,
} from "@/lib/layout";

describe("layoutModeForWidth", () => {
  it("switches at 768 and 1280", () => {
    expect(layoutModeForWidth(360)).toBe("mobile");
    expect(layoutModeForWidth(767)).toBe("mobile");
    expect(layoutModeForWidth(768)).toBe("tablet");
    expect(layoutModeForWidth(1279)).toBe("tablet");
    expect(layoutModeForWidth(1280)).toBe("desktop");
  });
});

describe("computeInsets", () => {
  const closed: LayoutState = {
    leftOpen: false,
    rightOpen: false,
    agentDrawerOpen: false,
    layoutMode: "desktop",
  };

  it("leaves the rail's width when everything is closed", () => {
    expect(computeInsets(closed, 900)).toEqual({ left: RAIL_WIDTH, right: 0, bottom: 0 });
  });

  it("covers the full sidebar widths when open", () => {
    expect(computeInsets({ ...closed, leftOpen: true, rightOpen: true }, 900)).toEqual({
      left: LEFT_WIDTH,
      right: RIGHT_WIDTH,
      bottom: 0,
    });
  });

  it("takes 30% of the height for the agent drawer", () => {
    expect(computeInsets({ ...closed, agentDrawerOpen: true }, 1000).bottom).toBe(300);
  });

  it("on phones, an open panel is a bottom sheet over the lower half", () => {
    const phone = { ...closed, layoutMode: "mobile" as const };
    expect(computeInsets({ ...phone, rightOpen: true }, 800)).toEqual({
      left: 0,
      right: 0,
      bottom: 400,
    });
    expect(computeInsets(phone, 800)).toEqual({ left: 0, right: 0, bottom: 0 });
  });
});
