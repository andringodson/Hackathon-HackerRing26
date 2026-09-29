"""GDACS (UN and European Commission) alerts for cyclones, floods and wildfires. Free, no key.

EVENTS4APP returns the 100 most recently updated current events. Polling it every few minutes and
keeping history in the database covers the 7-day window. Earthquakes are skipped: USGS covers them
with more detail, and merging duplicates is the verification agent's job (brief section 6.2).
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from app.models import DisasterEvent, EventSource, Location

log = logging.getLogger(__name__)

URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP"

HAZARDS = {"TC": "cyclone", "FL": "flood", "WF": "wildfire"}
SEVERITY = {"red": "critical", "orange": "high", "green": "low"}


def _utc(value: str) -> datetime:
    # GDACS timestamps are UTC without an offset.
    return datetime.fromisoformat(value).replace(tzinfo=timezone.utc)


def _coords_label(lat: float, lng: float) -> str:
    return f"{abs(lat):.1f}°{'N' if lat >= 0 else 'S'}, {abs(lng):.1f}°{'E' if lng >= 0 else 'W'}"


def parse(payload: dict) -> list[DisasterEvent]:
    events = []
    for feature in payload.get("features") or []:
        try:
            event = _parse_feature(feature)
        except (KeyError, TypeError, ValueError) as exc:
            log.warning("gdacs: skipping %s: %s", (feature.get("properties") or {}).get("eventid"), exc)
            continue
        if event:
            events.append(event)
    return events


def _parse_feature(feature: dict) -> DisasterEvent | None:
    p = feature["properties"]
    hazard = HAZARDS.get(p.get("eventtype"))
    if hazard is None or feature["geometry"]["type"] != "Point":
        return None

    lng, lat = feature["geometry"]["coordinates"][:2]
    level = (p.get("alertlevel") or "Green").strip()
    updated = _utc(p["datemodified"])
    summary = f"GDACS {level.lower()} alert."
    severity_text = ((p.get("severitydata") or {}).get("severitytext") or "").strip()
    # Flood severity text is a placeholder ("Magnitude 0"), so it is left out.
    if severity_text and hazard != "flood":
        summary += f" {severity_text}."
    report_url = (p.get("url") or {}).get("report")

    return DisasterEvent(
        id=f"gdacs-{p['eventtype'].lower()}-{p['eventid']}",
        type=hazard,
        title=p.get("name") or p.get("description") or hazard.title(),
        place=(p.get("country") or "").strip() or _coords_label(lat, lng),
        severity=SEVERITY.get(level.lower(), "low"),
        confidence=0.85,
        confidence_reasoning=f"Single source: GDACS {level.lower()} alert, from impact models.",
        source_count=1,
        status="verified",
        occurred_at=_utc(p["fromdate"]),
        updated_at=updated,
        location=Location(lat=lat, lng=lng),
        summary=summary,
        sources=[
            EventSource(
                id="gdacs",
                name="GDACS",
                kind="official",
                reliability=0.9,
                agreement=1.0,
                url=report_url,
                reported_at=updated,
            )
        ],
    )


async def fetch(client: httpx.AsyncClient) -> list[DisasterEvent]:
    response = await client.get(URL)
    response.raise_for_status()
    return parse(response.json())
