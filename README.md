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

Options (all have free tiers):

- **Render:** New > Blueprint, pick this repo. `render.yaml` creates the database and both services.
  Free services sleep after 15 minutes idle (the first request then takes up to a minute), and the
  free database expires after 30 days.
- **One VM** (Oracle Cloud Always Free, any VPS): `docker compose up -d --build`.
- **Mix and match:** API and web on Koyeb, Fly.io or Cloud Run, database on Neon or Supabase (both
  offer PostGIS). Set the three values above.

The `ci` workflow runs the API tests against PostGIS, then starts the full stack with
`docker-compose.yml` and checks that real events reach the browser through the proxy.
