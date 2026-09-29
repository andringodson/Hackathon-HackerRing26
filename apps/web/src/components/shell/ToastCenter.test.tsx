import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it } from "vitest";
import { ToastCenter } from "@/components/shell/ToastCenter";
import messages from "@/i18n/messages/en.json";
import { useMapStore } from "@/store/map.store";
import { useToastStore } from "@/store/toast.store";

function renderToasts() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <ToastCenter />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe("ToastCenter", () => {
  beforeEach(() => {
    useMapStore.setState({ selectedEventId: null });
    useToastStore.setState({
      seen: new Set(),
      toasts: [{ id: "quake-1", title: "M6.2 Earthquake", place: "Assam", lng: 92.9, lat: 26.1 }],
    });
  });

  it("shows the alert inside a live region", () => {
    renderToasts();
    const region = screen.getByRole("status", { name: "Alerts" });
    expect(region).toHaveTextContent("New critical event");
    expect(region).toHaveTextContent("M6.2 Earthquake · Assam");
  });

  it("View opens the event and clears the toast", () => {
    renderToasts();
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(useMapStore.getState().selectedEventId).toBe("quake-1");
    expect(useToastStore.getState().toasts).toEqual([]);
  });
});
