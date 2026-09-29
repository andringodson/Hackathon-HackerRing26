"""USGS earthquakes, magnitude 2.5+ over the past week (updated every minute, free, no key).

Feed docs: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from app.models import DisasterEvent, EventSource, Location

log = logging.getLogger(__name__)

URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson"

# PAGER estimates shaking impact; its level wins when it is higher than the magnitude band.
PAGER_SEVERITY = {"red": "critical", "orange": "high", "yellow": "moderate", "green": "low"}
SEVERITY_ORDER = ["info", "low", "moderate", "high", "critical"]


def magnitude_severity(mag: float) -> str:
    if mag >= 7.0:
        return "critical"
    if mag >= 6.0:
        return "high"
    if mag >= 5.0:
        return "moderate"
    if mag >= 4.0:
        return "low"
    return "info"


def _ms_to_dt(ms: int) -> datetime:
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)


def parse(payload: dict) -> list[DisasterEvent]:
    events = []
    for feature in payload.get("features") or []:
        try:
            event = _parse_feature(feature)
        except (KeyError, TypeError, ValueError) as exc:
            log.warning("usgs: skipping %s: %s", feature.get("id"), exc)
            continue
        if event:
            events.append(event)
    return events


def _parse_feature(feature: dict) -> DisasterEvent | None:
    p = feature["properties"]
    coords = feature["geometry"]["coordinates"]
    mag = p.get("mag")
    # The feed also carries quarry blasts and explosions.
    if p.get("type") != "earthquake" or mag is None:
        return None

    severity = magnitude_severity(mag)
    pager = PAGER_SEVERITY.get(p.get("alert") or "")
    if pager and SEVERITY_ORDER.index(pager) > SEVERITY_ORDER.index(severity):
        severity = pager

    reviewed = p.get("status") == "reviewed"
    place = p.get("place") or ""
    depth = coords[2] if len(coords) > 2 else None
    summary = f"Magnitude {mag:.1f} earthquake"
    if place:
        summary += f", {place}"
    if depth is not None:
        summary += f", at a depth of {depth:.0f} km"
    summary += "."
    if p.get("alert"):
        summary += f" USGS PAGER impact alert: {p['alert']}."

    updated = _ms_to_dt(p["updated"])
    return DisasterEvent(
        id=f"usgs-{feature['id']}",
        type="earthquake",
        title=f"M{mag:.1f} Earthquake",
        place=place,
        severity=severity,
        confidence=0.95 if reviewed else 0.8,
        confidence_reasoning=(
            "USGS solution reviewed by a seismologist."
            if reviewed
            else "Automatic USGS solution, not yet reviewed. Magnitude and location may change."
        ),
        source_count=1,
        status="verified",
        occurred_at=_ms_to_dt(p["time"]),
        updated_at=updated,
        location=Location(lat=coords[1], lng=coords[0]),
        magnitude=round(mag, 1),
        summary=summary,
        sources=[
            EventSource(
                id="usgs",
                name="USGS Earthquake Hazards Program",
                kind="sensor",
                reliability=0.95,
                agreement=1.0,
                url=p.get("url"),
                reported_at=updated,
            )
        ],
    )


async def fetch(client: httpx.AsyncClient) -> list[DisasterEvent]:
    response = await client.get(URL)
    response.raise_for_status()
    return parse(response.json())
