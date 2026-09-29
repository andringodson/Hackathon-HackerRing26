import json
from pathlib import Path

from app.db import bbox_condition
from app.sources import gdacs, usgs

FIXTURES = Path(__file__).parent / "fixtures"


def load(name):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def test_usgs_skips_non_earthquakes():
    events = usgs.parse(load("usgs.json"))
    assert len(events) == 4
    assert "usgs-us6000txh0" not in {e.id for e in events}  # mining explosion


def test_usgs_maps_fields():
    event = next(e for e in usgs.parse(load("usgs.json")) if e.id == "usgs-us6000tyc1")
    assert event.type == "earthquake"
    assert event.title == "M5.4 Earthquake"
    assert event.place == "99 km SSE of Pangai, Tonga"
    assert event.magnitude == 5.4
    assert event.severity == "moderate"
    assert event.status == "verified"
    assert event.location.lat == -20.6773 and event.location.lng == -174.0813
    assert event.occurred_at.isoformat() == "2026-09-29T12:40:35.064000+00:00"
    assert event.summary == (
        "Magnitude 5.4 earthquake, 99 km SSE of Pangai, Tonga, at a depth of 10 km."
        " USGS PAGER impact alert: green."
    )
    assert event.sources[0].url == "https://earthquake.usgs.gov/earthquakes/eventpage/us6000tyc1"


def test_usgs_automatic_solutions_get_lower_confidence():
    events = {e.id: e for e in usgs.parse(load("usgs.json"))}
    assert events["usgs-nc75444342"].confidence < events["usgs-us6000tyc1"].confidence


def test_usgs_severity_takes_the_higher_of_magnitude_and_pager():
    assert usgs.magnitude_severity(7.1) == "critical"
    assert usgs.magnitude_severity(3.0) == "info"
    payload = load("usgs.json")
    feature = payload["features"][0]
    feature["properties"].update(mag=4.2, alert="orange")
    assert usgs.parse({"features": [feature]})[0].severity == "high"
    feature["properties"].update(mag=6.5, alert="green")
    assert usgs.parse({"features": [feature]})[0].severity == "high"


def test_gdacs_maps_hazards_and_skips_earthquakes():
    events = gdacs.parse(load("gdacs.json"))
    assert sorted(e.type for e in events) == ["cyclone", "cyclone", "flood", "wildfire"]


def test_gdacs_maps_fields():
    events = {e.id: e for e in gdacs.parse(load("gdacs.json"))}
    cyclone = events["gdacs-tc-1001321"]
    assert cyclone.title == "Tropical Cyclone NOLO-26"
    assert cyclone.place == "United States"
    assert cyclone.severity == "low"
    assert cyclone.updated_at.isoformat() == "2026-09-29T10:22:15+00:00"
    assert "250 km/h" in cyclone.summary
    assert cyclone.sources[0].url.startswith("https://www.gdacs.org/report.aspx")
    # No country: fall back to coordinates. Flood severity text is a placeholder and is dropped.
    assert events["gdacs-tc-1001330"].place.endswith(("E", "W"))
    assert "Magnitude" not in events["gdacs-fl-1104183"].summary


def test_events_serialise_to_the_frontend_shape():
    data = usgs.parse(load("usgs.json"))[0].to_json()
    assert {"occurredAt", "updatedAt", "sourceCount", "confidenceReasoning"} <= data.keys()
    assert "official" not in data  # None values are left out
    assert data["sources"][0]["reportedAt"].endswith("Z")


def test_bbox_condition_handles_the_antimeridian():
    sql, params = bbox_condition((67, 5.5, 99, 37.5))
    assert " OR " not in sql and params == [67, 5.5, 99, 37.5]
    sql, params = bbox_condition((170, -30, -170, 10))
    assert " OR " in sql and params == [170, -30, 180, 10, -180, -30, -170, 10]
    _, params = bbox_condition((-200, 0, 200, 10))
    assert params == [-180, 0, 180, 10]
    _, params = bbox_condition((190, 0, 200, 10))
    assert params == [-170, 0, -160, 10]
