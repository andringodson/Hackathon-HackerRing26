"""API tests against a real Postgres with PostGIS (CI starts one). Skipped without DATABASE_URL."""

import os
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app import db
from app.models import DisasterEvent

pytestmark = pytest.mark.skipif(
    not os.environ.get("DATABASE_URL"), reason="needs DATABASE_URL (Postgres with PostGIS)"
)

NOW = datetime.now(timezone.utc)


def make_event(id, *, type="earthquake", severity="moderate", lat=20.0, lng=80.0, age=timedelta(minutes=5), status="verified"):
    at = NOW - age
    return DisasterEvent(
        id=id, type=type, title=id, place="Test", severity=severity, confidence=0.9,
        source_count=1, status=status, occurred_at=at, updated_at=at,
        location={"lat": lat, "lng": lng},
    )


async def truncate(pool):
    async with pool.connection() as conn:
        await conn.execute("TRUNCATE events")


@pytest.fixture
def client():
    from app.main import app

    with TestClient(app) as c:
        c.portal.call(truncate, app.state.pool)
        yield c


def seed(client, *events):
    client.portal.call(db.upsert_events, client.app.state.pool, list(events))


def ids(response):
    assert response.status_code == 200, response.text
    return [e["id"] for e in response.json()]


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok" and body["database"] is True


def test_lists_newest_first_in_frontend_shape(client):
    seed(client, make_event("old", age=timedelta(hours=2)), make_event("new"))
    response = client.get("/api/events")
    assert ids(response) == ["new", "old"]
    event = response.json()[0]
    assert event["location"] == {"lat": 20.0, "lng": 80.0}
    assert "sourceCount" in event and "official" not in event


def test_filters(client):
    seed(
        client,
        make_event("quake"),
        make_event("flood", type="flood", severity="critical"),
        make_event("week-old", age=timedelta(days=3)),
        make_event("unverified", status="unverified"),
        make_event("fiji", lat=-17.7, lng=178.0),
    )
    assert set(ids(client.get("/api/events?range=24h"))) == {"quake", "flood", "fiji"}
    assert "week-old" in ids(client.get("/api/events?range=7d"))
    assert ids(client.get("/api/events?type=flood")) == ["flood"]
    assert ids(client.get("/api/events?severity=critical,high")) == ["flood"]
    assert "unverified" in ids(client.get("/api/events?unverified=true"))
    assert set(ids(client.get("/api/events?bbox=67,5.5,99,37.5"))) == {"quake", "flood"}
    assert ids(client.get("/api/events?bbox=170,-30,-170,10")) == ["fiji"]


def test_rejects_bad_filters(client):
    assert client.get("/api/events?type=volcano").status_code == 422
    assert client.get("/api/events?range=1y").status_code == 422
    assert client.get("/api/events?bbox=1,2,3").status_code == 422


def test_get_event(client):
    seed(client, make_event("usgs-abc"))
    assert client.get("/api/events/usgs-abc").json()["id"] == "usgs-abc"
    assert client.get("/api/events/missing").status_code == 404


def test_older_update_does_not_overwrite_newer(client):
    seed(client, make_event("e", severity="high", age=timedelta(minutes=1)))
    seed(client, make_event("e", severity="low", age=timedelta(minutes=10)))
    assert client.get("/api/events/e").json()["severity"] == "high"
