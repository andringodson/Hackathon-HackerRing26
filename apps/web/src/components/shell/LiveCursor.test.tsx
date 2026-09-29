import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveCursor } from "@/components/shell/LiveCursor";
import { useMediaQuery } from "@/hooks/useMediaQuery";

vi.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: vi.fn() }));

const cursor = () => document.querySelector<HTMLElement>(".live-cursor-el");
const pointer = (enabled: boolean) => vi.mocked(useMediaQuery).mockReturnValue(enabled);

describe("LiveCursor", () => {
  afterEach(() => document.documentElement.classList.remove("live-cursor"));

  it("stays out of the way on touch screens", () => {
    pointer(false);
    render(<LiveCursor />);
    expect(cursor()).toBeNull();
    expect(document.documentElement).not.toHaveClass("live-cursor");
  });

  it("hides the native cursor only while mounted", () => {
    pointer(true);
    const { unmount } = render(<LiveCursor />);
    expect(cursor()).not.toBeNull();
    expect(document.documentElement).toHaveClass("live-cursor");
    unmount();
    expect(document.documentElement).not.toHaveClass("live-cursor");
  });

  it("locks on to clickable things and steps aside for text fields", () => {
    pointer(true);
    render(
      <>
        <LiveCursor />
        <p>plain</p>
        <button>
          <span>inside a button</span>
        </button>
        <input aria-label="search" />
      </>,
    );
    const over = (el: Element) => fireEvent.pointerOver(el);

    over(screen.getByText("inside a button"));
    expect(cursor()).toHaveAttribute("data-state", "target");
    over(screen.getByLabelText("search"));
    expect(cursor()).toHaveAttribute("data-state", "text");
    over(screen.getByText("plain"));
    expect(cursor()).toHaveAttribute("data-state", "idle");
  });

  it("contracts while pressed", () => {
    pointer(true);
    render(<LiveCursor />);
    fireEvent.pointerDown(window);
    expect(cursor()).toHaveAttribute("data-pressed", "true");
    fireEvent.pointerUp(window);
    expect(cursor()).toHaveAttribute("data-pressed", "false");
  });
});
