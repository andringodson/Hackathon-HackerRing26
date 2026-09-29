"use client";

import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarRange,
  Eraser,
  Layers,
  List,
  MapPin,
  Moon,
  Search,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { HazardIcon } from "@/components/events/HazardIcon";
import { SeverityIcon } from "@/components/events/SeverityBadge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { SEARCH_INPUT_ID } from "@/lib/dom";
import { EVENT_FOCUS_ZOOM } from "@/lib/geo";
import { searchPlaces, zoomForBbox, type Place } from "@/lib/geocode";
import { TIME_RANGES } from "@/lib/time-range";
import { cn } from "@/lib/utils";
import { selectEvent } from "@/store/actions";
import { useFiltersStore, useHasActiveFilters } from "@/store/filters.store";
import { useMapStore } from "@/store/map.store";
import { useUiStore } from "@/store/ui.store";
import type { DisasterEvent } from "@/types/event";

/** Nominatim asks for at most one request a second; typing pauses are longer than this. */
const PLACE_DEBOUNCE_MS = 400;
const MIN_PLACE_QUERY = 3;
const MAX_EVENTS = 5;

const GROUP_LABEL = {
  events: "command.events",
  places: "command.places",
  actions: "command.actionsGroup",
} as const;

interface Item {
  id: string;
  group: "events" | "places" | "actions";
  label: string;
  detail?: string;
  icon: ReactNode;
  run: () => void;
}

/**
 * One box for everything (Ctrl/Cmd+K, "/" or the top bar search): live events, places anywhere
 * (OpenStreetMap), and actions (panels, layers, theme, time range). Arrow keys move, Enter runs,
 * Esc closes. A combobox over a listbox, so screen readers follow the active option.
 */
export function CommandPalette() {
  const t = useTranslations("command");
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[12vh] left-1/2 z-[61] w-[min(92vw,560px)] -translate-x-1/2 overflow-hidden rounded-xl border bg-panel shadow-[var(--shadow-float)] outline-none"
        >
          <Dialog.Title className="sr-only">{t("title")}</Dialog.Title>
          {open && <PaletteBody close={() => setOpen(false)} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PaletteBody({ close }: { close: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const q = query.trim().toLowerCase();
  const placeQuery = useDebouncedValue(query.trim(), PLACE_DEBOUNCE_MS);

  const { data: events } = useLiveEvents();
  const places = useQuery({
    queryKey: ["places", locale, placeQuery.toLowerCase()],
    queryFn: () => searchPlaces(placeQuery, locale),
    enabled: placeQuery.length >= MIN_PLACE_QUERY,
    staleTime: Infinity,
  });
  const actions = useActions();

  const items = useMemo<Item[]>(() => {
    const run = (fn: () => void) => () => {
      close();
      fn();
    };
    const eventItems = (events ?? [])
      .filter((e) => !q || `${e.title} ${e.place}`.toLowerCase().includes(q))
      .slice(0, MAX_EVENTS)
      .map((e: DisasterEvent) => ({
        id: e.id,
        group: "events" as const,
        label: e.title,
        detail: e.place,
        icon: (
          <span className="flex items-center gap-1">
            <SeverityIcon severity={e.severity} className="size-3.5" />
            <HazardIcon type={e.type} className="size-3.5 text-muted-foreground" />
          </span>
        ),
        run: run(() =>
          selectEvent(e.id, { lng: e.location.lng, lat: e.location.lat, zoom: EVENT_FOCUS_ZOOM }),
        ),
      }));
    const placeItems =
      placeQuery.length >= MIN_PLACE_QUERY && q.length >= MIN_PLACE_QUERY
        ? (places.data ?? []).map((p: Place) => ({
            id: p.id,
            group: "places" as const,
            label: p.name,
            detail: p.detail,
            icon: <MapPin aria-hidden className="size-4 text-muted-foreground" />,
            run: run(() =>
              useMapStore
                .getState()
                .focusOn({ lng: p.lng, lat: p.lat, zoom: p.bbox ? zoomForBbox(p.bbox) : 10 }),
            ),
          }))
        : [];
    const actionItems = actions
      .filter((a) => !q || a.label.toLowerCase().includes(q))
      .map((a) => ({ ...a, run: run(a.run) }));
    return [...eventItems, ...placeItems, ...actionItems];
  }, [events, places.data, placeQuery, q, actions, close]);

  const current = Math.min(active, Math.max(items.length - 1, 0));
  const optionId = (i: number) => `${listId}-${i}`;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (items.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = (current + step + items.length) % items.length;
      setActive(next);
      document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      items[current]?.run();
    }
  };

  const searching = places.isFetching && q.length >= MIN_PLACE_QUERY;
  const groups = (["events", "places", "actions"] as const)
    .map((group) => ({
      group,
      entries: items.map((item, i) => ({ item, i })).filter((e) => e.item.group === group),
    }))
    .filter((g) => g.entries.length > 0);

  return (
    <div className="flex max-h-[70vh] flex-col">
      <div className="flex items-center gap-3 border-b px-4">
        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <input
          id={SEARCH_INPUT_ID}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={items.length ? optionId(current) : undefined}
          aria-autocomplete="list"
          aria-label={t("command.placeholder")}
          placeholder={t("command.placeholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {searching && (
          <span className="numeric shrink-0 text-[11px] text-muted-foreground">
            {t("command.searching")}
          </span>
        )}
      </div>

      <div
        id={listId}
        role="listbox"
        aria-label={t("command.title")}
        className="min-h-0 flex-1 overflow-y-auto py-2"
      >
        {groups.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {searching ? t("command.searching") : t("command.empty")}
          </p>
        )}
        {groups.map(({ group, entries }) => (
          <div key={group} role="group" aria-label={t(GROUP_LABEL[group])} className="pb-1">
            <p aria-hidden className="label-caps px-4 pt-2 pb-1.5">
              {t(GROUP_LABEL[group])}
            </p>
            {entries.map(({ item, i }) => (
              <div
                key={item.id}
                id={optionId(i)}
                role="option"
                aria-selected={i === current}
                onMouseMove={() => i !== current && setActive(i)}
                onClick={item.run}
                className={cn(
                  "mx-2 flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm",
                  i === current ? "bg-primary/10 text-foreground" : "text-foreground/90",
                )}
              >
                <span className="flex w-9 shrink-0 justify-center">{item.icon}</span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.detail && (
                  <span className="max-w-[45%] shrink-0 truncate text-xs text-muted-foreground">
                    {item.detail}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground">
        <span>
          <kbd className="numeric">↑↓</kbd> {t("command.navigate")}
        </span>
        <span>
          <kbd className="numeric">↵</kbd> {t("command.open")}
        </span>
        <span>
          <kbd className="numeric">esc</kbd> {t("command.close")}
        </span>
        {groups.some((g) => g.group === "places") && (
          <span className="ml-auto">{t("command.osm")}</span>
        )}
      </div>
    </div>
  );
}

/** The things you can do from the palette. Labels follow the current state (e.g. theme). */
function useActions(): Item[] {
  const t = useTranslations();
  const theme = useUiStore((s) => s.theme);
  const hasActiveFilters = useHasActiveFilters();

  return useMemo(() => {
    const icon = (Icon: LucideIcon) => (
      <Icon aria-hidden className="size-4 text-muted-foreground" />
    );
    const ui = () => useUiStore.getState();
    const filters = () => useFiltersStore.getState();
    const list: Item[] = [
      {
        id: "toggle-events",
        group: "actions",
        label: t("topbar.toggleEvents"),
        icon: icon(List),
        run: () => ui().toggleLeft(),
      },
      {
        id: "layers",
        group: "actions",
        label: t("command.actions.layers"),
        icon: icon(Layers),
        run: () => ui().setLayersOpen(true),
      },
      {
        id: "theme",
        group: "actions",
        label: theme === "dark" ? t("command.actions.themeLight") : t("command.actions.themeDark"),
        icon: icon(theme === "dark" ? Sun : Moon),
        run: () => ui().toggleTheme(),
      },
      ...TIME_RANGES.map((range) => ({
        id: `range-${range}`,
        group: "actions" as const,
        label: t("command.actions.range", { range: t(`filters.range.${range}`) }),
        icon: icon(CalendarRange),
        run: () => filters().setTimeRange(range),
      })),
    ];
    if (hasActiveFilters) {
      list.push({
        id: "clear-filters",
        group: "actions",
        label: t("filters.clear"),
        icon: icon(Eraser),
        run: () => filters().reset(),
      });
    }
    return list;
  }, [t, theme, hasActiveFilters]);
}
