import type { ReactElement, ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOOT_FADE_MS,
  BOOT_MAX_MS,
  BOOT_MIN_MS,
  BOOT_SOURCES_GRACE_MS,
  BootScreen,
} from "@/components/shell/BootScreen";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { useMapInstance } from "@/hooks/useMapInstance";
import messages from "@/i18n/messages/en.json";

vi.mock("@/hooks/useMapInstance", () => ({ useMapInstance: vi.fn() }));
vi.mock("@/hooks/useLiveEvents", () => ({ useLiveEvents: vi.fn() }));

const setMap = (ready: boolean) =>
  vi.mocked(useMapInstance).mockReturnValue((ready ? {} : null) as ReturnType<typeof useMapInstance>);
const setEvents = (pending: boolean) =>
  vi.mocked(useLiveEvents).mockReturnValue({ isPending: pending } as ReturnType<typeof useLiveEvents>);

// A wrapper (not renderWithIntl) so rerender keeps the messages.
const IntlWrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
);
const renderWithIntl = (ui: ReactElement) => render(ui, { wrapper: IntlWrapper });

const boot = () => screen.queryByRole("status", { name: "Loading DisasterIntel" });
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("BootScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setMap(false);
    setEvents(true);
  });
  afterEach(() => vi.useRealTimers());

  it("reports the real step: map first, then data", () => {
    const { rerender } = renderWithIntl(<BootScreen />);
    expect(boot()).toHaveTextContent("Rendering map");
    expect(boot()).toHaveAttribute("aria-busy", "true");

    setMap(true);
    rerender(<BootScreen />);
    // No API is configured in tests, so the app is on demo data.
    expect(boot()).toHaveTextContent("Loading sample data");
  });

  it("leaves once the map and data are ready, but not before the logo has converged", () => {
    const { rerender } = renderWithIntl(<BootScreen />);
    setMap(true);
    setEvents(false);
    rerender(<BootScreen />);
    expect(boot()).toHaveAttribute("data-state", "loading");

    advance(BOOT_MIN_MS);
    expect(boot()).toHaveAttribute("data-state", "leaving");
    advance(BOOT_FADE_MS);
    expect(boot()).toBeNull();
  });

  it("stops waiting for data that is slow to arrive (a sleeping API)", () => {
    const { rerender } = renderWithIntl(<BootScreen />);
    setMap(true);
    rerender(<BootScreen />);
    advance(BOOT_SOURCES_GRACE_MS - 1);
    expect(boot()).toHaveAttribute("data-state", "loading");
    advance(1);
    expect(boot()).toHaveAttribute("data-state", "leaving");
  });

  it("never traps the app, even if the map fails to load", () => {
    renderWithIntl(<BootScreen />);
    advance(BOOT_MAX_MS);
    expect(boot()).toHaveAttribute("data-state", "leaving");
    advance(BOOT_FADE_MS);
    expect(boot()).toBeNull();
  });
});
