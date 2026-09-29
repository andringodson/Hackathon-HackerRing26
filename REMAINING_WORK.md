# What is left to implement

Snapshot of `andringodson/Hackathon-HackerRing26` at `911abc2` (14 commits, 2026-09-29), measured
against `frontend-design-doc.md` (phases F1 to F7) and `disaster-intel-project-brief 2.md`.

**How this was scanned.** By cloning the repo and reading the diff since the scaffold commit
(`6f14419`), the new feeds and API code, the README, the `.env.example`, the sidebar and feed
components, and every `TODO(Fn)` marker (30 markers in 29 files). The app was **not** built and the
tests were **not** run on this version, and `BootScreen`, `LiveCursor` and the CSS were not read in
detail. Run `npm run check` before trusting the "done" column.

Paths below are relative to `apps/web/` unless they start with `apps/api` or `.github`.

---

## 1. Where the project stands

The repo is **frontend only**. The FastAPI backend, Docker image, CI workflow and Render/Neon deploy
were all built (`0783759`, `dd3bb79`, `6f52f5b`, `f2cc426`) and then **reverted** (`9171cfa`). Nothing
of them is on `main`, but the whole backend is recoverable: `git show dd3bb79` has `apps/api` (FastAPI
app, USGS and GDACS sources, database layer, ingest, tests).

Built since the scaffold:

- **Real events with no backend.** `lib/feeds` reads USGS (earthquakes, M2.5+, past week) and GDACS
  (cyclones, floods, wildfires) straight from the browser, with one shared download per minute and
  partial-failure tolerance (one source down does not blank the map). `NEXT_PUBLIC_DATA_SOURCE=demo`
  switches back to sample data.
- **Brand and feel.** Logo, boot screen (waits for the map and first events), live cursor (mouse and
  pen only), OLED-black default theme with hairline borders, monospace numbers, section labels.
- **Events sidebar redesign.** Count badge on the rail, live dot, new-row highlight, per-severity
  counts on the filter chips, "Show last 7 days" empty state.
- **Better time logic.** `activityTime` so a quake revised by USGS days later does not look new.

---

## 2. Status by phase

| Phase | Status | Summary |
|---|---|---|
| F1 Shell | **Done** | Layout, sidebars, rail, controls, themes, EN/TA/HI, shortcuts, restyled |
| F2 Events | **Mostly done** | Real feeds, feed, filters, markers, fly-to. Left: URL state, search, marker shapes and clustering, virtualization |
| F3 Detail | **Partial** | Header, Overview, Sources done. Resources and Population not started. Real events have no guidance or impact |
| F4 Live and forecast | Not started | No WebSocket, no toasts, no stale banner, no forecast |
| F5 Public tools | Not started | No report flow, no "Near me", no PWA or offline, Tamil/Hindi fonts missing |
| F6 Responder tools | Not started | No auth (`/dashboard` is open), no alert composer, agent graph or admin pages |
| F7 Polish | Not started | No bottom sheets, no accessibility audit, no Playwright |

Design doc section 16 checklist:

| Item | State |
|---|---|
| Map fills the viewport, never covered by permanent UI | Done |
| Sidebars open and close smoothly and remember state | Done (left panel is remembered) |
| Every severity has colour, icon and text | Done |
| Every event shows confidence and source count | Done, but the numbers are constants (see 3.3) |
| Selected event shareable via URL | **Not done** (parser exists, unused) |
| Works on a 360px phone | Done (checked at 375px on the scaffold, not since the redesign) |
| Works offline with cached data and a stale banner | **Not done** |
| All controls keyboard accessible | Partial (markers are not; the feed is the alternative) |
| EN, TA, HI render correctly | Partial (translations are drafts; no Tamil or Hindi fonts) |
| No paid fonts, tiles, icons or services | Done |

---

## 3. Fix first (correctness and trust)

Small changes with the biggest effect on whether the demo can be trusted.

- [ ] **3.1 Wrong label on every real event.** Both parsers set `official: null`, so the detail panel
  shows **"Advisory · Verified by DisasterIntel"** on USGS and GDACS events. Nothing has been verified
  by DisasterIntel; each event has exactly one source. Set `official: { authority: "USGS" }` in
  `lib/feeds/usgs.ts` and `{ authority: "GDACS" }` in `lib/feeds/gdacs.ts` (the brief says to label
  official relays with attribution), and reword `detail.advisory` in `i18n/messages/{en,ta,hi}.json`
  so it does not claim verification until a verification step exists.
- [ ] **3.2 No "What should I do?" for real events.** The feeds set no `guidance` or `impact`, so the
  Overview tab shows one summary line. The design doc says every event answers what happened, where,
  how sure, and what to do. Add hazard-and-severity guidance templates (short, plain language, in all
  three languages, reviewed by someone qualified) and show them for feed events.
- [ ] **3.3 Confidence is hard-coded.** USGS is 0.95 (reviewed) or 0.8, GDACS is 0.85, and
  `sourceCount` is always 1. That is honest as a stop-gap (the reasoning text says "single source"),
  but it is not the cross-source score the brief describes. See 5.
- [ ] **3.4 The feed is worldwide, the app is framed around India.** USGS returns every M2.5+ quake on
  Earth, so the list is mostly non-Indian events. Add a region filter (India or Worldwide) and make
  India the default, or add "Near me".
- [ ] **3.5 Run `npm run check`** on the current tip and fix whatever the redesign broke.
- [ ] **3.6 Decide whether browser-only is the architecture.** Every visitor now calls USGS and GDACS
  directly. That works for a demo but cannot do verification, deduplication, alerts or anything that
  needs a secret. See section 6.

---

## 4. Frontend work left, by phase

### F2 Events

- [ ] **URL state.** `lib/url-state.ts` parses and serializes `?event=&layers=&t=&lat=&lng=&z=` and has
  tests, but nothing uses it. Wire it to the stores and the address bar; deep links must select the
  event and restore the view.
- [ ] **Place search.** `components/shell/LocationSearch.tsx` is an input only. Geocode with Nominatim
  (1 request per second on the public server: debounce and cache) and fly to the result.
- [ ] **Marker language.** `components/map/layers/EventsLayer.tsx` draws severity-coloured circles.
  Still to do: a distinct shape per hazard (ring for quake, triangle for fire, diamond for landslide),
  clustering with a count and the worst severity, a one-time pulse for events under 30 minutes old,
  and a dashed outline for unverified events.
- [ ] **Feed scale.** Virtualize `LiveFeed` with `@tanstack/react-virtual` and add "Load more". A
  worldwide feed can be hundreds of rows.
- [ ] **Keyboard.** `←` and `→` for previous and next event (`hooks/useKeyboardShortcuts.ts`).
- [ ] **Saved areas.** The rail button is disabled; it needs accounts.

### F3 Detail

- [ ] **Resources tab and layer.** `detail/tabs/ResourcesTab.tsx`, `map/layers/ResourcesLayer.tsx`:
  nearest shelters, hospitals and routes, shown on the map from zoom 9 or while the tab is open.
  Types are in `types/resource.ts`. Free sources: OpenStreetMap Overpass, OSRM.
- [ ] **Population layer and impact numbers.** `map/layers/PopulationLayer.tsx` (WorldPop, likely a
  deck.gl overlay). Feed events have no `impact` block, so "People exposed", "Hospitals in zone" and
  "Shelters nearby" never show. This needs geodata, so it leans on the backend.
- [ ] **Layers popover.** Forecast, Population, Resources, Satellite and Rainfall/wind are all
  disabled with a "Soon" hint. Only Events and Roads work.
- [ ] **Sources tab.** Shows one source per event until cross-source merging exists.

### F4 Live and forecast

- [ ] **Live push.** The browser polls the feeds about once a minute. When there is a backend, add a
  WebSocket (SSE, then polling as fallbacks) that writes into the query cache, batched every 500 ms
  (`hooks/useLiveEvents.ts`, `NEXT_PUBLIC_WS_URL`).
- [ ] **Toasts.** `components/shell/ToastCenter.tsx` is an empty live region. Build the toast store and
  the "New critical event: … [View]" toast, announced to screen readers.
- [ ] **Stale-data banner and per-source freshness.** `StatusStrip.tsx` only knows loaded or error.
  Add connection state, a "Data stale" banner with the last update time, and amber dots for sources
  that stopped updating.
- [ ] **Forecast.** `map/layers/ForecastLayer.tsx`, `detail/tabs/ForecastTab.tsx`,
  `map/TimeSlider.tsx` (translate labels, play and pause): flood extent, fire perimeter, cyclone track
  and cone. Needs forecast data (Open-Meteo, GloFAS, cyclone tracks).
- [ ] **Location errors.** `MapControls.tsx`: tell the user when location is denied or unavailable.

### F5 Public tools

- [ ] **Report an incident.** `components/report/ReportSheet.tsx`, `LocationPicker.tsx`, `/report`:
  hazard type, photo, pin (auto from GPS), description, consent note, "checked before it appears".
  Add `react-hook-form`, `zod`, `@hookform/resolvers`. Needs a backend endpoint and moderation, and
  location data must be minimised and expired (DPDP Act).
- [ ] **"Near me"** chip and local risk card.
- [ ] **PWA and offline.** No manifest, service worker or offline cache yet. Cache the app shell, the
  last events and safety guides (Workbox). Add low-bandwidth mode (static markers, no heavy layers,
  polling) to `SettingsMenu.tsx`.
- [ ] **Tamil and Hindi.** Add `@fontsource/noto-sans-tamil` and `noto-sans-devanagari` (TODO in
  `app/layout.tsx`); until then those scripts use system fonts. Have a native speaker review all
  Tamil and Hindi strings, including the new boot and feed strings.

### F6 Responder tools

- [ ] **Auth and roles.** `/login`, guard `/dashboard` and `/admin/*`, derive the role in
  `RoleProvider.tsx`, real account menu in `UserMenu.tsx`. **Today `/dashboard` is open to anyone.**
- [ ] **Alert composer** (`detail/tabs/AlertTab.tsx`): AI draft, edit, language tabs, audience polygon
  drawn on the map, approve and send, audit log. Load it lazily. Needs the backend.
- [ ] **Agent monitor.** Replace the static `agents/AgentGraph.tsx` with React Flow (`@xyflow/react`),
  build `LogStream.tsx` and `detail/tabs/TraceTab.tsx`, add pipeline health to the top-bar dot, and
  "Replay run".
- [ ] **Pages.** `/dashboard/analytics` (charts), `/dashboard/reports` (SITREPs and PDFs),
  `/admin/sources`, `/admin/users`, `/admin/settings`. All are placeholders.
- [ ] **Unverified and watchlist events** for responders. The UI plumbing exists (`status:
  "unverified"`); no source produces them yet.

### F7 Polish

- [ ] **Bottom sheets.** `components/sidebar/BottomSheet.tsx` is a static stub. Make it draggable
  (peek 96px, half, full) and use it below 768px; Filters as a full-screen sheet on phones.
- [ ] **Accessibility audit.** Screen-reader pass, focus management, 200% text zoom, forced-colors
  and high-contrast, keyboard access to markers. Specific to the new work: the live cursor replaces
  the pointer (check with keyboard, touch and forced colors) and the boot screen needs a proper
  announcement. `tokens.test.ts` only checks the severity colours match, **not contrast**: recheck
  every token pair on the OLED-black theme. `--text-muted` was already below WCAG AA.
- [ ] **Light basemap** for the light theme (MapLibre `transformStyle`, keeping the data layers).
  The map is always dark today.
- [ ] **Performance.** Initial JS was about 265 KB gzipped on the scaffold against a 250 KB target;
  re-measure after the boot screen, cursor and roughly 300 lines of new CSS. The map library is a
  separate lazy chunk (about 270 KB gzipped).
- [ ] **Playwright** end-to-end tests for the core flows (not installed).
- [ ] **Map tests.** Unit tests cover logic and stores, not the map; the store-to-MapLibre adapter is
  only checked by hand.
- [ ] Hide the top bar while dragging the map (optional).

---

## 5. Backend and platform (project brief)

Nothing here exists on `main`. "Reverted" means it existed in `dd3bb79` and can be recovered.

| Area | State |
|---|---|
| FastAPI REST and WebSocket API | Reverted (basic endpoints, USGS and GDACS sources, tests) |
| Database (Postgres, later Neon) | Reverted; PostGIS and pgvector never built |
| Ingestion workers and more sources (EMSC, NASA FIRMS, Open-Meteo, GloFAS, IMD, ReliefWeb, GDELT, RSS, Bluesky) | Only USGS and GDACS ever existed |
| Redis Streams event bus | Not built |
| Agents: supervisor, ingestion, social/news, **verification**, geospatial, risk, resource, alert, summarizer (LangGraph, Ollama via LiteLLM) | Not built |
| Confidence gates (below 0.6 drop, 0.6 to 0.85 human review, above 0.85 with official source auto) | Not built |
| Human approval gate and audit log | Not built |
| Alert delivery: Telegram, web push (VAPID), email | Not built |
| SITREP generation (Markdown and PDF, sources cited) | Not built |
| Citizen report intake and moderation | Not built |
| Auth (FastAPI-Users or Keycloak) | Not built |
| Prompt-injection protection for social text | Not built |
| Observability (Prometheus, Grafana, GlitchTip, Langfuse) | Not built |
| CI (GitHub Actions), Docker, hosted deploy | Reverted; `main` has no `.github`, no Dockerfile |
| Evals on past disasters, success metrics | Not built |
| OpenAPI-generated types replacing `types/*.ts` | Waiting on a backend schema |

---

## 6. Decisions to make

1. **Browser-only or backend?** The revert removed the backend. Choose deliberately: browser-only is
   fast to demo but cannot verify, deduplicate, alert or hold secrets.
2. **Where does it deploy?** Hosting was tried (Render, Neon, Docker) and reverted. Nothing is deployed.
3. **OLED black instead of the doc's navy.** Update the design doc and tokens to match, and re-check
   contrast (3 above).
4. **Live cursor.** It replaces the system pointer. Decide whether that is acceptable for a
   life-safety tool, or make it opt-in.
5. **India-first or global?** Affects the default filter, the map view and the copy.
6. **Labelling policy.** When may an event say "Official"? The brief says only when relayed from an
   official source with attribution.
7. **Pinned dependencies stay:** `next-intl` 4.4.0 and `maplibre-gl` 5.x (reasons in the README).

---

## 7. Suggested order

1. Section 3: the label fix (3.1), guidance templates (3.2), region default (3.4), `npm run check`
   (3.5). Half a day, and the demo stops overclaiming.
2. Demo polish: URL deep links, place search, marker shapes and clustering.
3. Toasts and the stale-data banner (they need no backend).
4. Pick **one** headline feature: the public report flow, or the responder alert composer. Both need a
   backend, so decide on section 6.1 first; recovering `dd3bb79` is the fastest start.
5. PWA and offline, Tamil and Hindi fonts and review.
6. Polish and accessibility audit last.
