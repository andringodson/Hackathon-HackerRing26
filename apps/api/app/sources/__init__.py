"""Free data sources (brief section 7.5). Each module exposes fetch(client) -> list[DisasterEvent]."""

from app.sources import gdacs, usgs

SOURCES = {"usgs": usgs.fetch, "gdacs": gdacs.fetch}
