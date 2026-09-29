# DisasterIntel web

The map-first frontend for the Multi-Agent Disaster Intelligence Platform: a full-screen map with
everything else in two collapsible sidebars. Built from
[`frontend-design-doc.md`](../../frontend-design-doc.md) and
[`disaster-intel-project-brief 2.md`](<../../disaster-intel-project-brief 2.md>). Section numbers below
(for example "design doc 2.5") refer to the design doc.

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI, Zustand, TanStack Query,
MapLibre GL JS, next-intl. All free and open source.

## Quick start

```bash
cd apps/web
npm install
npm run dev          # http://localhost:3000
```

It shows **real events with no backend**: `lib/feeds` reads the public USGS (earthquakes) and GDACS
(cyclones, floods, wildfires) feeds straight from the browser, once a minute, and filters them on the
client. Both allow any origin, need no key and are free. For the built-in sample events instead
(offline work, screenshots), set `NEXT_PUBLIC_DATA_SOURCE=demo`; the status strip then says "Demo
data". Tests always use the sample events. A backend plugs in later through `NEXT_PUBLIC_API_URL`.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | Generates route types, then `tsc --noEmit` |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm test` / `npm run test:watch` | Vitest and Testing Library |
| `npm run check` | typecheck, lint, tests, build. Run it before pushing |

Try it: click a marker or a feed row (map flies there, detail opens), press `[` `]` `/` `L` `F` `Esc`,
switch language (EN, TA, HI) and theme in the top bar, open `/dashboard` for the responder view
(`A` opens the agent drawer).

## What exists

Phase F1 (shell) is done. Slices of F2 and F3 are in so the shell has something to show.

- **Shell:** full-viewport map, floating top bar, left and right sidebars that overlay the map (never
  resize it), left rail when collapsed, map controls, layers popover, status strip, agent drawer
  stub, toast live region, keyboard shortcuts, dark and light themes (no flash), EN/TA/HI.
- **Boot screen and logo:** `shell/BootScreen` covers the shell until the map has drawn and the
  first events are in (6 s grace for a waking API, 15 s cap), reporting the real step. The mark in
  `brand/Logo` (three sources converging on one verified point) is also the tab icon and top bar logo.
- **Live cursor:** `shell/LiveCursor` replaces the mouse pointer with the logo's arcs orbiting the
  hotspot and a radar ping; it locks on over clickable things and gives way to the I-beam in text
  fields. Mouse and pen only; reduced motion stops the spin and ping.
- **Events:** live feed with filters (time range, hazard, severity), hover sync between list and
  map, fly-to with sidebar-aware padding.
- **Markers** (`map/layers/EventsLayer`, `lib/map/markers`): one silhouette per hazard (quake disc
  with epicentre ring, flood drop, cyclone spiral, fire triangle, landslide diamond) in the severity
  colour with a severity-weighted outline; clusters below zoom 6 with the count and the worst
  severity as a ring (click to zoom in); a cyan target ring on hover and selection, the rest fade;
  a radar pulse on quakes under 30 minutes old. The live cursor locks on over markers too.
- **Detail panel:** header (severity, official vs advisory, confidence with source count), Overview
  and Sources tabs. Public users get four tabs, responders six.
- **Routes:** `/` and `/dashboard` are the map. Every other route in design doc section 7 exists as a
  placeholder that says which phase builds it.
- **Responsive:** tablet shows one sidebar at a time; phones get full-width sheets and 44px targets.

## What is a stub

Stubs are typed, listed here, and marked `TODO(Fn)` in the code. Phases are from design doc section 15.

| Where | Phase | Notes |
|---|---|---|
| `map/layers/ForecastLayer`, `TimeSlider`, `detail/tabs/ForecastTab` | F4 | Time slider already appears when the Forecast layer is on |
| `map/layers/PopulationLayer`, `ResourcesLayer`, `detail/tabs/ResourcesTab` | F3 | |
| WebSocket updates, toasts (`ToastCenter`), stale-data banner | F4 | Feed polls every 30 s for now |
| `report/ReportSheet`, `LocationPicker`, `/report` | F5 | |
| `shell/LocationSearch` | F2 | Input and `/` shortcut work; geocoding does not |
| PWA, offline, low-bandwidth mode | F5 | |
| `agents/AgentGraph`, `LogStream`, `detail/tabs/AlertTab`, `TraceTab`, auth, `/login`, `/admin/*` | F6 | **`/dashboard` has no auth yet** |
| `sidebar/BottomSheet` (draggable snap points), `←` `→` between events, Playwright | F7 | |
| URL state for layers, forecast time and viewport (`?layers=&t=&lat=&lng=&z=`) | F2 | The selected event is wired (`?event=`, `hooks/useSelectionUrl.ts`) |
| Markers: dashed outline for unverified events | F6 | Unverified events are drawn faint for now; they only exist once there is a verification pipeline |
| Virtualized feed, "Load more" | F2 | |

Not installed yet, add when you build the phase that needs it:
`@xyflow/react` (agent graph), `deck.gl` (heatmaps), `@tanstack/react-virtual`,
`react-hook-form zod @hookform/resolvers` (report form), `recharts` (analytics), a PWA plugin,
`@playwright/test`, and `@fontsource/noto-sans-tamil` / `noto-sans-devanagari` (Tamil and Hindi
fonts; until then those scripts fall back to system fonts).

## Structure

Follows design doc 13.2. `@/` is `src/`.

```
src/
├── app/                  Routes. page.tsx and dashboard/page.tsx render <AppShell />
├── components/
│   ├── shell/            AppShell, TopBar, StatusStrip, ToastCenter, menus, providers
│   ├── sidebar/          Sidebar (generic panel + rail), Left/RightSidebar, BottomSheet stub
│   ├── map/              MapCanvas, storeSync (the adapter), controls, layers/
│   ├── events/           LiveFeed, EventRow, FilterBar, SeverityBadge, ConfidenceBar
│   ├── detail/           EventDetail, EventHeader, tabs/
│   ├── agents/           AgentDrawer, AgentGraph, LogStream
│   ├── report/           ReportSheet, LocationPicker (stubs)
│   └── ui/               Button, Tabs, Popover, Tooltip, Switch, ... (shadcn conventions)
├── hooks/                useLiveEvents, useViewportEvents, useMapInstance, useKeyboardShortcuts, ...
├── store/                ui.store, map.store, filters.store, actions (cross-store actions)
├── lib/                  api/, mock/, map/, geo, events, formatters, layout, url-state, theme, ...
├── styles/               tokens.css (design tokens), globals.css (Tailwind theme)
├── i18n/                 config, request (locale cookie), messages/{en,ta,hi}.json
├── types/                DisasterEvent, Alert, AgentRun, Resource
└── test/                 Vitest setup and render helper
```

## Rules of the road

1. **The map never reads component state.** Components write to the Zustand stores; the adapter
   `components/map/storeSync.ts` follows the stores with vanilla subscriptions and drives MapLibre.
   `MapCanvas` renders one `<div>` and never re-renders for UI changes. Data layers (`EventsLayer`)
   own their sources and follow the stores themselves. To act on more than one store, use
   `store/actions.ts`, not a component.
2. **Sidebars overlay the map.** `AppShell` turns the open panels into `--inset-left/right/bottom`
   CSS variables (zeroed below 768px in CSS, so phones are right on first paint). Anything floating
   above the map positions itself with `calc(var(--inset-left) + 12px)` and friends. `computeInsets`
   in `lib/layout.ts` feeds both the CSS and MapLibre's padding.
3. **Severity is never colour alone**: colour, a distinct shape and a text label, and critical gets
   a thick outline. Use `SeverityBadge` or `SeverityIcon` with a label.
4. **Tokens live in `styles/tokens.css`.** Use the Tailwind names (`bg-panel`, `text-muted-foreground`,
   `bg-sev-critical`). The severity hexes are duplicated in `lib/severity.ts` because MapLibre cannot
   read CSS variables; `tokens.test.ts` fails if they drift.
5. **No hard-coded UI strings.** Use `useTranslations` and add the key to all three message files.
   Keys are type-checked against `en.json`, and `messages.test.ts` fails if `ta` or `hi` miss a key or
   drop a `{placeholder}`.
6. **Roles are the same layout with extra tools.** `RoleProvider` supplies the role; gate with the
   helpers in `lib/roles.ts`, not ad-hoc checks.
7. **Motion only signals change** and respects `prefers-reduced-motion` (CSS global rule; MapLibre
   handles its own).

Recipes:

- **Add a map layer:** copy `EventsLayer` (add source and layers on mount, take `map` as a prop,
  guard cleanup with `isAlive`), mount it in `layers/MapLayers.tsx`, add its id to `lib/map/layers.ts`
  and set `available: true`.
- **Add a detail tab:** add the id to `DETAIL_TABS` in `lib/roles.ts`, a `TabsContent` in
  `EventDetail`, and a `detail.tabs.<id>` message.
- **Add a live feed:** write a `load*()` that returns `DisasterEvent[]` in `lib/feeds/`, add it to
  `FEEDS` in `lib/feeds/index.ts`, and add a fixture test. The source must allow browser requests
  (CORS).
- **Switch to a backend:** set `NEXT_PUBLIC_API_URL`. `lib/api/events.ts` then calls `GET /api/events`
  and `GET /api/events/{id}`. Swap the hand-written `types/` for OpenAPI-generated ones when the
  backend has a schema.

## Decisions that differ from the design doc

- **The dark theme is OLED black, and it is the default.** Surfaces are pure `#000` instead of the
  doc's navy, with depth from hairline borders; the basemap's land is black and water a faint blue.
  First visits get dark whatever the system prefers; light stays available in settings.
- **next-intl is pinned to 4.4.0.** Later versions (4.5+) load `@swc/core` at config time, whose native
  loader refused to start on the dev machine (its cache directory inherited a foreign ACL) and needs
  npm's install-script approval. 4.4.0 supports Next 16 without it. Upgrade freely on machines where it
  works.
- **maplibre-gl is on 5.x, not 6.** Version 6 ships its web worker as a separate file that bundlers
  do not wire up, so it would need a copy-into-`public/` step and a manual `setWorkerUrl`. Version 5
  works with Turbopack out of the box. Revisit when there is time.
- **Locale is not in `ui.store`.** next-intl owns it (a `NEXT_LOCALE` cookie, no URL prefix), so the
  server and client agree.
- **A slim rail stays when the left sidebar is closed** (design doc 2.5 calls for a 48px rail;
  the 2.1 wireframe draws none). The right sidebar has no rail; it closes with the selection.
- **The light theme has its own accent (`#0E7490`).** The doc's cyan is 1.8:1 on white, too weak for
  the required 2px focus ring.
- **`--text-muted` (`#62708C`) is about 3.6:1 on the panel colour**, under WCAG AA for body text.
  It is used only for placeholders and disabled states. Meta text uses `text-secondary`. Consider
  lightening it.
- **The basemap stays dark in the light theme.** Swapping styles has to preserve the data layers
  (MapLibre's `transformStyle`); planned for F7.
- **Tamil and Hindi strings are drafts** and need a native-speaker review before launch.
- **Demo data uses generic source names** ("Seismic network (sample)"), never real agencies, and one
  fake "official" relay so that path is visible.

## Performance

Measured on the production build. Initial JS for `/` is about 265 KB gzipped (about 166 KB is the React
and Next runtime, about 100 KB is this app), a little over the 250 KB target in design doc 13.5.
The map library is its own lazy chunk of about 270 KB gzipped, loaded after the shell paints. Worth
tuning in F7.

## Testing

`npm test` runs pure-logic tests (filters, geometry, layout maths, URL state, formatters), store
tests, message parity across the three languages, design-token drift, and two component tests. The map
itself is not unit-tested; verify it in the browser.
