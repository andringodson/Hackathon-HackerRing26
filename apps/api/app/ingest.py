"""Scheduled ingestion: pull every source, upsert into Postgres, drop old events. Runs inside the
API process, so the free tier needs no separate worker. A failing source is logged and retried on
the next pass; it never stops the others."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

import httpx
from psycopg_pool import AsyncConnectionPool

from app import db
from app.sources import SOURCES

log = logging.getLogger(__name__)

USER_AGENT = "DisasterIntel/0.1 (+https://github.com/andringodson/Hackathon-HackerRing26)"


class Ingestor:
    def __init__(self, pool: AsyncConnectionPool, retention_days: int):
        self.pool = pool
        self.retention_days = retention_days
        self.first_pass_done = asyncio.Event()
        self.status: dict[str, dict] = {
            name: {"lastSuccess": None, "lastError": None, "events": 0} for name in SOURCES
        }

    async def run_once(self) -> None:
        async with httpx.AsyncClient(
            timeout=20, headers={"User-Agent": USER_AGENT}, follow_redirects=True
        ) as client:
            for name, fetch in SOURCES.items():
                try:
                    events = await fetch(client)
                    await db.upsert_events(self.pool, events)
                except Exception as exc:  # noqa: BLE001 - one bad source must not stop the rest
                    log.exception("ingest %s failed", name)
                    self.status[name]["lastError"] = f"{type(exc).__name__}: {exc}"
                    continue
                self.status[name].update(
                    lastSuccess=datetime.now(timezone.utc).isoformat(),
                    lastError=None,
                    events=len(events),
                )
                log.info("ingest %s: %d events", name, len(events))
        pruned = await db.prune(self.pool, self.retention_days)
        if pruned:
            log.info("pruned %d events older than %d days", pruned, self.retention_days)

    async def run_forever(self, interval_seconds: int) -> None:
        while True:
            try:
                await self.run_once()
            except Exception:  # noqa: BLE001
                log.exception("ingest pass failed")
            finally:
                self.first_pass_done.set()
            await asyncio.sleep(interval_seconds)
