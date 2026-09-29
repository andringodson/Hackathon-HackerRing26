import { describe, expect, it } from "vitest";
import {
  formatAbsoluteTime,
  formatAge,
  formatCompactNumber,
  formatPercent,
  formatRelativeTime,
} from "@/lib/formatters";

const NOW = Date.parse("2026-09-29T10:00:00Z");
const MIN = 60_000;
const HOUR = 3_600_000;

describe("formatAge", () => {
  it("is compact, and floors to the largest whole unit", () => {
    expect(formatAge(NOW - 31 * MIN, "en", NOW)).toBe("31m");
    expect(formatAge(NOW - 5.9 * HOUR, "en", NOW)).toBe("5h");
    expect(formatAge(NOW - 50 * HOUR, "en", NOW)).toBe("2d");
  });

  it("says now for under a minute, and for times slightly ahead of a stale clock", () => {
    expect(formatAge(NOW - 20_000, "en", NOW)).toBe("now");
    expect(formatAge(NOW + 2_000, "en", NOW)).toBe("now");
  });

  it("localizes the unit", () => {
    expect(formatAge(NOW - 5 * HOUR, "hi", NOW)).not.toBe("5h");
  });
});

describe("formatRelativeTime", () => {
  it("says now for the same instant", () => {
    expect(formatRelativeTime(NOW, "en", NOW)).toBe("now");
  });

  it("picks the largest sensible unit", () => {
    expect(formatRelativeTime(NOW - 2 * MIN, "en", NOW)).toMatch(/2 min/);
    expect(formatRelativeTime(NOW - 3 * HOUR, "en", NOW)).toMatch(/3 hr/);
    expect(formatRelativeTime(NOW - 24 * HOUR, "en", NOW)).toMatch(/yesterday/);
  });

  it("handles times in the future", () => {
    expect(formatRelativeTime(NOW + 5 * MIN, "en", NOW)).toMatch(/in 5 min/);
  });

  it("accepts ISO strings", () => {
    expect(formatRelativeTime("2026-09-29T09:58:00Z", "en", NOW)).toMatch(/2 min/);
  });

  it("localizes", () => {
    // Tamil and Hindi must not fall back to English digits and words.
    expect(formatRelativeTime(NOW - 2 * MIN, "hi", NOW)).not.toMatch(/min/);
    expect(formatRelativeTime(NOW - 2 * MIN, "ta", NOW)).not.toMatch(/min/);
  });
});

describe("other formatters", () => {
  it("formats absolute time in the given locale", () => {
    expect(formatAbsoluteTime("2026-09-29T10:00:00Z", "en")).toMatch(/2026/);
  });

  it("formats compact numbers", () => {
    expect(formatCompactNumber(1_200_000, "en")).toBe("1.2M");
    expect(formatCompactNumber(14, "en")).toBe("14");
  });

  it("formats percentages", () => {
    expect(formatPercent(0.923, "en")).toBe("92%");
  });
});
