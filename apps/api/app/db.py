"""Postgres + PostGIS access. The events table keeps each event's API JSON in `data` and copies
the fields the API filters on into columns (brief section 6.5, `events`)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional, Sequence

from psycopg.types.json import Jsonb
from psycopg_pool import AsyncConnectionPool

from app.models import DisasterEvent

Bbox = tuple[float, float, float, float]

SCHEMA = """
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE IF NOT EXISTS events (
    id          text PRIMARY KEY,
    type        text NOT NULL,
    severity    text NOT NULL,
    status      text NOT NULL,
    occurred_at timestamptz NOT NULL,
    updated_at  timestamptz NOT NULL,
    geom        geometry(Point, 4326) NOT NULL,
    data        jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS events_updated_at_idx ON events (updated_at DESC);
CREATE INDEX IF NOT EXISTS events_geom_idx ON events USING gist (geom);
"""

UPSERT = """
INSERT INTO events (id, type, severity, status, occurred_at, updated_at, geom, data)
VALUES (%(id)s, %(type)s, %(severity)s, %(status)s, %(occurred_at)s, %(updated_at)s,
        ST_SetSRID(ST_MakePoint(%(lng)s, %(lat)s), 4326), %(data)s)
ON CONFLICT (id) DO UPDATE SET
    type = EXCLUDED.type, severity = EXCLUDED.severity, status = EXCLUDED.status,
    occurred_at = EXCLUDED.occurred_at, updated_at = EXCLUDED.updated_at,
    geom = EXCLUDED.geom, data = EXCLUDED.data
WHERE events.updated_at <= EXCLUDED.updated_at
"""

ENVELOPE = "geom && ST_MakeEnvelope(%s, %s, %s, %s, 4326)"


async def init_schema(pool: AsyncConnectionPool) -> None:
    async with pool.connection() as conn:
        await conn.execute(SCHEMA)


async def ping(pool: AsyncConnectionPool) -> None:
    async with pool.connection() as conn:
        await conn.execute("SELECT 1")


async def upsert_events(pool: AsyncConnectionPool, events: Sequence[DisasterEvent]) -> None:
    rows = [
        {
            "id": e.id,
            "type": e.type,
            "severity": e.severity,
            "status": e.status,
            "occurred_at": e.occurred_at,
            "updated_at": e.updated_at,
            "lng": e.location.lng,
            "lat": e.location.lat,
            "data": Jsonb(e.to_json()),
        }
        for e in events
    ]
    if not rows:
        return
    async with pool.connection() as conn:
        async with conn.transaction():
            async with conn.cursor() as cur:
                await cur.executemany(UPSERT, rows)


async def prune(pool: AsyncConnectionPool, retention_days: int) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    async with pool.connection() as conn:
        cur = await conn.execute("DELETE FROM events WHERE updated_at < %s", (cutoff,))
        return cur.rowcount


def bbox_condition(bbox: Bbox) -> tuple[str, list[float]]:
    """SQL for "point inside the box". A box whose west edge is east of its east edge crosses the
    antimeridian, the same rule as bboxContains in apps/web/src/lib/geo.ts."""
    west, south, east, north = bbox
    if east - west >= 360:
        return ENVELOPE, [-180, south, 180, north]
    # Map bounds can run past ±180 when the world wraps; bring them back into range.
    if not -180 <= west <= 180:
        west = (west + 180) % 360 - 180
    if not -180 <= east <= 180:
        east = (east + 180) % 360 - 180
    if west <= east:
        return ENVELOPE, [west, south, east, north]
    return f"({ENVELOPE} OR {ENVELOPE})", [west, south, 180, north, -180, south, east, north]


async def list_events(
    pool: AsyncConnectionPool,
    *,
    since: datetime,
    types: Sequence[str] = (),
    severities: Sequence[str] = (),
    bbox: Optional[Bbox] = None,
    include_unverified: bool = False,
    limit: int = 1000,
) -> list[dict]:
    where = ["updated_at >= %s"]
    params: list = [since]
    if types:
        where.append("type = ANY(%s)")
        params.append(list(types))
    if severities:
        where.append("severity = ANY(%s)")
        params.append(list(severities))
    if not include_unverified:
        where.append("status = 'verified'")
    if bbox:
        condition, values = bbox_condition(bbox)
        where.append(condition)
        params.extend(values)
    params.append(limit)
    sql = f"SELECT data FROM events WHERE {' AND '.join(where)} ORDER BY updated_at DESC LIMIT %s"
    async with pool.connection() as conn:
        cur = await conn.execute(sql, params)
        return [row[0] for row in await cur.fetchall()]


async def get_event(pool: AsyncConnectionPool, event_id: str) -> Optional[dict]:
    async with pool.connection() as conn:
        cur = await conn.execute("SELECT data FROM events WHERE id = %s", (event_id,))
        row = await cur.fetchone()
        return row[0] if row else None
