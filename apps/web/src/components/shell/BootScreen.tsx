"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LogoMark } from "@/components/brand/Logo";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { useMapInstance } from "@/hooks/useMapInstance";
import { USE_MOCKS } from "@/lib/env";
import { cn } from "@/lib/utils";

/** Long enough for the logo to finish converging, so a fast load does not flash. */
export const BOOT_MIN_MS = 900;
/** After the map is up, how long to wait for the first events. The API may be waking from sleep;
 * past this the feed shows its own loading state instead. */
export const BOOT_SOURCES_GRACE_MS = 6_000;
/** Never cover the app longer than this, even if the map fails to load (no WebGL, style down). */
export const BOOT_MAX_MS = 15_000;
export const BOOT_FADE_MS = 500;

/**
 * Covers the shell until the map has drawn and the first events have arrived. Rendered on the
 * server, so it is on screen from the first paint and animates while the JavaScript downloads.
 * The status line reports the real step, not a timer.
 */
export function BootScreen() {
  const t = useTranslations("boot");
  const tApp = useTranslations("app");
  const mapReady = useMapInstance() !== null;
  const sourcesReady = !useLiveEvents().isPending;

  const [minElapsed, setMinElapsed] = useState(false);
  const [sourcesTimedOut, setSourcesTimedOut] = useState(false);
  const [maxElapsed, setMaxElapsed] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const min = setTimeout(() => setMinElapsed(true), BOOT_MIN_MS);
    const max = setTimeout(() => setMaxElapsed(true), BOOT_MAX_MS);
    return () => {
      clearTimeout(min);
      clearTimeout(max);
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const grace = setTimeout(() => setSourcesTimedOut(true), BOOT_SOURCES_GRACE_MS);
    return () => clearTimeout(grace);
  }, [mapReady]);

  const leaving =
    maxElapsed || (minElapsed && mapReady && (sourcesReady || sourcesTimedOut));

  useEffect(() => {
    if (!leaving) return;
    const fade = setTimeout(() => setGone(true), BOOT_FADE_MS);
    return () => clearTimeout(fade);
  }, [leaving]);

  if (gone) return null;

  const status = !mapReady
    ? t("map")
    : !sourcesReady
      ? t(USE_MOCKS ? "demo" : "sources")
      : t("ready");

  return (
    <div
      role="status"
      aria-label={t("label")}
      aria-busy={!leaving}
      data-state={leaving ? "leaving" : "loading"}
      className={cn(
        "fixed inset-0 z-50 grid place-items-center bg-background transition-opacity ease-out",
        "data-[state=leaving]:pointer-events-none data-[state=leaving]:opacity-0",
      )}
      style={{ transitionDuration: `${BOOT_FADE_MS}ms` }}
    >
      <div className="flex flex-col items-center">
        <LogoMark animated className="size-14 text-primary" />
        <p className="mt-6 pl-[0.4em] text-[11px] font-semibold tracking-[0.4em] text-foreground uppercase">
          {tApp("name")}
        </p>
        <div aria-hidden className="mt-5 flex gap-1.5">
          <BootStep done={mapReady} active={!mapReady} />
          <BootStep done={mapReady && sourcesReady} active={mapReady && !sourcesReady} />
        </div>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          {status}
          {!leaving && <span className="boot-caret" aria-hidden />}
        </p>
      </div>
    </div>
  );
}

/** A hairline segment: fills when its step is done, shimmers while it runs. */
function BootStep({ done, active }: { done: boolean; active: boolean }) {
  return (
    <span
      data-done={done || undefined}
      data-active={active || undefined}
      className="boot-step relative h-px w-10 overflow-hidden bg-border"
    />
  );
}
