"""API models. They mirror apps/web/src/types/event.ts (JSON keys are camelCase)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

HazardType = Literal["earthquake", "flood", "cyclone", "wildfire", "landslide"]
Severity = Literal["critical", "high", "moderate", "low", "info"]
TimeRange = Literal["1h", "6h", "24h", "7d"]

HAZARD_TYPES: tuple[str, ...] = ("earthquake", "flood", "cyclone", "wildfire", "landslide")
SEVERITIES: tuple[str, ...] = ("critical", "high", "moderate", "low", "info")


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Location(CamelModel):
    lat: float
    lng: float


class Official(CamelModel):
    authority: str


class EventSource(CamelModel):
    id: str
    name: str
    kind: Literal["official", "news", "social", "citizen", "sensor"]
    reliability: float
    agreement: float
    url: Optional[str] = None
    reported_at: datetime
    stale: Optional[bool] = None


class EventImpact(CamelModel):
    people_exposed: Optional[int] = None
    hospitals_in_zone: Optional[int] = None
    shelters_nearby: Optional[int] = None


class DisasterEvent(CamelModel):
    id: str
    type: HazardType
    title: str
    place: str
    severity: Severity
    confidence: float
    confidence_reasoning: Optional[str] = None
    source_count: int
    status: Literal["verified", "unverified"]
    occurred_at: datetime
    updated_at: datetime
    location: Location
    magnitude: Optional[float] = None
    official: Optional[Official] = None
    summary: Optional[str] = None
    guidance: Optional[list[str]] = None
    impact: Optional[EventImpact] = None
    sources: Optional[list[EventSource]] = None

    def to_json(self) -> dict:
        return self.model_dump(mode="json", by_alias=True, exclude_none=True)
