# DisasterIntel

Multi-agent disaster intelligence platform. See the [project brief](<disaster-intel-project-brief 2.md>)
and the [frontend design doc](frontend-design-doc.md).

| Part | What | Docs |
|---|---|---|
| `apps/web` | Next.js map-first frontend | [README](apps/web/README.md) |
| `apps/api` | FastAPI backend: ingests USGS and GDACS, serves `/api/events` | [README](apps/api/README.md) |
| Postgres + PostGIS | Event store | |

## Run it

```bash
docker compose up --build     # http://localhost:3000, API on http://localhost:8000/docs
```

Or run the frontend alone on demo data: `cd apps/web && npm install && npm run dev`.

## Deploy

Everything ships as two Docker images plus Postgres with PostGIS, so it runs on any container host.
Nothing is tied to one provider.

```
browser ──> web (Next.js) ──/backend proxy──> api (FastAPI) ──> Postgres + PostGIS
                                               └── every 5 min: USGS, GDACS
```

| Setting | Where | Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | web, build time | `/backend` (leave empty for a demo-data build) |
| `API_URL` | web, runtime | The API's URL, e.g. `https://disasterintel-api.onrender.com` |
| `DATABASE_URL` | api, runtime | Postgres connection string. The database needs the PostGIS extension |

Everything here uses plans that are free for good, not trials or free periods that expire.

- **Live setup: Render web services + Neon Postgres.** Create a Neon project (PostGIS works out of
  the box), then in Render: New > Blueprint, connect GitHub, pick this repo, and paste Neon's direct
  (not pooled) connection string when asked for `DATABASE_URL`. Free Render services sleep after 15
  minutes idle, so the first visit after that takes up to a minute.
- **One VM** (Oracle Cloud Always Free, any VPS): `docker compose up -d --build`.
- **Mix and match:** API and web on any container host, database on any Postgres with PostGIS. Set
  the three values above.

The `ci` workflow runs the API tests against PostGIS, then starts the full stack with
`docker-compose.yml` and checks that real events reach the browser through the proxy. Render deploys
an app only after a push to `main` that touches it passes these checks (`autoDeployTrigger:
checksPass` in `render.yaml`).
