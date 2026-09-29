import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MapCredits } from "@/components/map/MapCredits";
import { renderWithIntl } from "@/test/render";

describe("MapCredits", () => {
  it("keeps the OpenStreetMap credit one click away", () => {
    renderWithIntl(<MapCredits />);
    fireEvent.click(screen.getByRole("button", { name: "Map and data credits" }));
    expect(screen.getByRole("link", { name: "© OpenStreetMap" })).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/copyright",
    );
    expect(screen.getByRole("link", { name: "OpenFreeMap" })).toBeInTheDocument();
  });
});
