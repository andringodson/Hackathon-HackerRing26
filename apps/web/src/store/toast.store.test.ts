import { beforeEach, describe, expect, it } from "vitest";
import { createMockEvents } from "@/lib/mock/events";
import { MAX_TOASTS, useToastStore } from "@/store/toast.store";
import type { DisasterEvent } from "@/types/event";

const [base] = createMockEvents().filter((e) => e.severity === "critical");
const critical = (id: string): DisasterEvent => ({ ...base, id, title: `Quake ${id}` });
const store = () => useToastStore.getState();

describe("critical-event toasts", () => {
  beforeEach(() => useToastStore.setState({ toasts: [], seen: null }));

  it("stays quiet about what is already there on first load", () => {
    store().observe([critical("a"), critical("b")]);
    expect(store().toasts).toEqual([]);
  });

  it("alerts once for each critical event that appears later", () => {
    store().observe([critical("a")]);
    store().observe([critical("a"), critical("b")]);
    store().observe([critical("a"), critical("b")]);
    expect(store().toasts.map((t) => t.id)).toEqual(["b"]);
  });

  it("ignores anything below critical", () => {
    store().observe([]);
    store().observe([{ ...critical("c"), severity: "high" }]);
    expect(store().toasts).toEqual([]);
  });

  it("keeps the newest few, and dismisses by id", () => {
    store().observe([]);
    store().observe(["1", "2", "3", "4"].map(critical));
    expect(store().toasts.map((t) => t.id)).toEqual(["2", "3", "4"].slice(-MAX_TOASTS));
    store().dismiss("3");
    expect(store().toasts.map((t) => t.id)).toEqual(["2", "4"]);
  });
});
