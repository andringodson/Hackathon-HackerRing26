# DisasterIntel API

FastAPI backend for phase 1 of the roadmap (brief section 10): data ingestion, API, live map. It
pulls free feeds every 5 minutes, stores events in Postgres with PostGIS, and serves the contract
the frontend calls (`apps/web/src/lib/api/events.ts`).

| Endpoint | |
|---|---|
| `GET /api/events` | Newest first. `range` (1h, 6h, 24h, 7d), `type` and `severity` (comma lists), `bbox` (west,south,east,north; crossing the antimeridian is fine), `unverified=true`, `limit` |
| `GET /api/events/{id}` | One event, 404 if unknown |
| `GET /api/health` | Database status and each source's last success or error |
| `GET /docs` | Interactive OpenAPI docs |

## Sources

| Source | Hazards | Severity |
|---|---|---|
| USGS, M2.5+ past week | Earthquakes | Magnitude: 7+ critical, 6+ high, 5+ moderate, 4+ low, else info. Raised to the PAGER impact alert when that is higher (red critical, orange high, yellow moderate) |
| GDACS | Cyclones, floods, wildfires | Alert level: red critical, orange high, green low |

GDACS earthquakes are skipped because USGS covers them. Merging reports of one event from several
sources is the verification agent's job (phase 2), so every event has one source for now. Confidence
is 0.95 for a reviewed USGS solution, 0.8 for an automatic one, and 0.85 for GDACS.

## Run locally

Needs Postgres with PostGIS; `docker compose up db` from the repo root starts one.

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
DATABASE_URL=postgresql://disasterintel:disasterintel@localhost:5432/disasterintel uvicorn app.main:app --reload
pytest   # the database tests run only when DATABASE_URL is set
```

| Variable | Default | |
|---|---|---|
| `DATABASE_URL` | local Postgres | Must allow `CREATE EXTENSION postgis` (Render, Neon and Supabase do) |
| `INGEST_INTERVAL_SECONDS` | 300 | `0` turns ingestion off |
| `RETENTION_DAYS` | 30 | Older events are deleted |
| `CORS_ORIGINS` | `*` | Only matters when a browser calls the API directly instead of through the web proxy |

Ingestion runs inside the API process, so there is no separate worker to host. Run one instance;
two would both ingest (harmless, since writes are idempotent, but wasteful).
