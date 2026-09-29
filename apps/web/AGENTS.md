<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project conventions (DisasterIntel web)

Read `README.md` first, then the design doc it links. The rules that matter most:

- The map never reads component state. Components write to the Zustand stores; `components/map/storeSync.ts` drives MapLibre from them. Use `store/actions.ts` when one action must move two stores.
- Sidebars overlay the map. Float UI with the `--inset-*` CSS variables, never by resizing the map.
- Severity is never colour alone: colour, shape and a text label together.
- No hard-coded UI strings. Add each key to `en.json`, `ta.json` and `hi.json` (a test enforces parity).
- Colours come from `styles/tokens.css` through Tailwind names. Keep `lib/severity.ts` in sync with the `--sev-*` tokens.
- Run `npm run check` before calling work done. Verify map and layout changes in the browser, not only in tests.
- Dependencies are deliberately pinned in two places (next-intl 4.4.0, maplibre-gl 5.x). The reasons are in the README; do not upgrade them to fix an unrelated problem.
