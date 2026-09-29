import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sidebar } from "@/components/sidebar/Sidebar";

const panel = (open: boolean, withRail = false) =>
  render(
    <Sidebar
      side="left"
      open={open}
      width={320}
      label="Test panel"
      rail={withRail ? <button>rail action</button> : undefined}
    >
      <button>inside</button>
    </Sidebar>,
  );

describe("Sidebar", () => {
  it("is inert while closed, so nothing off screen can take focus or be read out", () => {
    panel(false);
    const aside = screen.getByLabelText("Test panel", { selector: "aside" });
    expect(aside).toHaveAttribute("inert");
    expect(aside).toHaveAttribute("data-state", "closed");
  });

  it("is interactive while open", () => {
    panel(true);
    const aside = screen.getByLabelText("Test panel", { selector: "aside" });
    expect(aside).not.toHaveAttribute("inert");
    expect(aside).toHaveAttribute("data-state", "open");
  });

  it("uses the requested width", () => {
    panel(true);
    expect(screen.getByLabelText("Test panel", { selector: "aside" })).toHaveStyle({ width: "320px" });
  });

  it("shows its rail while closed and makes it inert while open", () => {
    const { rerender } = panel(false, true);
    const rail = () => screen.getByText("rail action").parentElement;
    expect(rail()).not.toHaveAttribute("inert");

    rerender(
      <Sidebar side="left" open width={320} label="Test panel" rail={<button>rail action</button>}>
        <button>inside</button>
      </Sidebar>,
    );
    expect(rail()).toHaveAttribute("inert");
  });

  it("has no rail unless one is given", () => {
    panel(false);
    expect(screen.queryByText("rail action")).not.toBeInTheDocument();
  });
});
