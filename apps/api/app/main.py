"""DisasterIntel API. Serves the contract apps/web/src/lib/api/events.ts calls."""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from psycopg_pool import AsyncConnectionPool

from app import db
from app.ingest import Ingestor
from app.models import HAZARD_TYPES, SEVERITIES, DisasterEvent, TimeRange

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("disasterintel")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
# 0 turns ingestion off (tests).
INGEST_INTERVAL_SECONDS = int(os.environ.get("INGEST_INTERVAL_SECONDS", "300"))
RETENTION_DAYS = int(os.environ.get("RETENTION_DAYS", "30"))
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]
# How long startup waits for the first ingest pass, so a cold start does not serve an empty map.
FIRST_PASS_TIMEOUT_SECONDS = 25

RANGES = {
    "1h": timedelta(hours=1),
    "6h": timedelta(hours=6),
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    pool = AsyncConnectionPool(
        DATABASE_URL,
        min_size=1,
        max_size=5,
        open=False,
        kwargs={"autocommit": True},
        # Serverless Postgres (Neon) drops idle connections when it scales to zero; check each one
        # before handing it out so a request never lands on a dead connection.
        check=AsyncConnectionPool.check_connection,
    )
    await pool.open(wait=True, timeout=30)
    await db.init_schema(pool)
    ingestor = Ingestor(pool, RETENTION_DAYS)
    app.state.pool = pool
    app.state.ingestor = ingestor

    task = None
    if INGEST_INTERVAL_SECONDS > 0:
        task = asyncio.create_task(ingestor.run_forever(INGEST_INTERVAL_SECONDS))
        try:
            await asyncio.wait_for(ingestor.first_pass_done.wait(), FIRST_PASS_TIMEOUT_SECONDS)
        except asyncio.TimeoutError:
            log.warning("first ingest pass still running; serving what the database has")
    try:
        yield
    finally:
        if task:
            task.cancel()
        await pool.close()


app = FastAPI(title="DisasterIntel API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["GET"])


def _csv(value: Optional[str], allowed: tuple[str, ...], name: str) -> list[str]:
    items = [v.strip() for v in (value or "").split(",") if v.strip()]
    unknown = [v for v in items if v not in allowed]
    if unknown:
        raise HTTPException(422, f"Unknown {name}: {', '.join(unknown)}")
    return items


def _bbox(value: Optional[str]) -> Optional[db.Bbox]:
    if not value:
        return None
    try:
        west, south, east, north = (float(v) for v in value.split(","))
    except ValueError:
        raise HTTPException(422, "bbox must be west,south,east,north") from None
    if not (-90 <= south <= north <= 90):
        raise HTTPException(422, "bbox latitudes must satisfy -90 <= south <= north <= 90")
    return west, south, east, north


@app.get("/api/health")
async def health(request: Request):
    try:
        await db.ping(request.app.state.pool)
    except Exception:  # noqa: BLE001
        log.exception("health check: database unreachable")
        return JSONResponse({"status": "error", "database": False}, status_code=503)
    return {"status": "ok", "database": True, "sources": request.app.state.ingestor.status}


@app.get("/api/events", response_model=list[DisasterEvent], response_model_exclude_none=True)
async def list_events(
    request: Request,
    time_range: TimeRange = Query("24h", alias="range"),
    types: Optional[str] = Query(None, alias="type", description="Comma-separated hazard types"),
    severities: Optional[str] = Query(None, alias="severity", description="Comma-separated"),
    bbox: Optional[str] = Query(None, description="west,south,east,north"),
    unverified: bool = False,
    limit: int = Query(1000, ge=1, le=2000),
):
    """Events updated within the time range, newest first."""
    return await db.list_events(
        request.app.state.pool,
        since=datetime.now(timezone.utc) - RANGES[time_range],
        types=_csv(types, HAZARD_TYPES, "type"),
        severities=_csv(severities, SEVERITIES, "severity"),
        bbox=_bbox(bbox),
        include_unverified=unverified,
        limit=limit,
    )


@app.get("/api/events/{event_id}", response_model=DisasterEvent, response_model_exclude_none=True)
async def get_event(request: Request, event_id: str):
    event = await db.get_event(request.app.state.pool, event_id)
    if event is None:
        raise HTTPException(404, "Event not found")
    return event
