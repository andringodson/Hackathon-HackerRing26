import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeverityBadge } from "@/components/events/SeverityBadge";
import { SEVERITIES } from "@/lib/severity";
import { renderWithIntl } from "@/test/render";

describe("SeverityBadge", () => {
  it("shows a text label, so severity is never colour alone", () => {
    renderWithIntl(<SeverityBadge severity="critical" />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("gives every severity its own icon shape", () => {
    const shapes = new Set<string>();
    for (const severity of SEVERITIES) {
      const { container, unmount } = renderWithIntl(<SeverityBadge severity={severity} />);
      shapes.add(container.querySelector("svg")?.getAttribute("class")?.match(/lucide-[\w-]+/)?.[0] ?? "");
      unmount();
    }
    expect(shapes.size).toBe(SEVERITIES.length);
  });

  it("draws critical with a thick outline", () => {
    const { container } = renderWithIntl(<SeverityBadge severity="critical" />);
    expect(container.firstElementChild?.className).toContain("border-2");
  });

  it("names itself when icon-only", () => {
    renderWithIntl(<SeverityBadge severity="high" iconOnly />);
    expect(screen.getByRole("img", { name: "High" })).toBeInTheDocument();
    expect(screen.queryByText("High")).not.toBeInTheDocument();
  });
});
