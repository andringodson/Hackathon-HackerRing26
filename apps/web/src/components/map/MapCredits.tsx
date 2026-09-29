"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DATA_SOURCE, OWN_MAP_CREDITS } from "@/lib/env";

/**
 * Credits for the map and the data (the OpenStreetMap licence requires the map credit to be
 * reachable). A glass (i) button in the bottom-right corner opens them in a popover that sits above
 * the map controls and the status strip, instead of MapLibre's control, which lives inside the
 * map and could only open underneath them.
 *
 * Only for the default basemap (see OWN_MAP_CREDITS); other styles keep MapLibre's control.
 */
export function MapCredits() {
  const t = useTranslations("map.credits");
  if (!OWN_MAP_CREDITS) return null;

  return (
    <div className="fixed right-[calc(var(--inset-right)+12px)] bottom-[calc(var(--inset-bottom)+12px)] z-10 transition-[right,bottom] duration-200 ease-out">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t("label")}
            className="glass grid size-[30px] place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <Info aria-hidden className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-72">
          <p className="label-caps mb-2.5">{t("title")}</p>
          <dl className="space-y-2 text-xs">
            <Credit label={t("mapData")}>
              <Link href="https://www.openstreetmap.org/copyright">© OpenStreetMap</Link>
            </Credit>
            <Credit label={t("tiles")}>
              <Link href="https://openfreemap.org">OpenFreeMap</Link>
              {" · "}
              <Link href="https://www.openmaptiles.org/">© OpenMapTiles</Link>
            </Credit>
            {DATA_SOURCE === "feeds" && (
              <Credit label={t("events")}>
                <Link href="https://earthquake.usgs.gov/earthquakes/feed/">USGS</Link>
                {" · "}
                <Link href="https://www.gdacs.org">GDACS</Link>
              </Credit>
            )}
            <Credit label={t("places")}>
              <Link href="https://nominatim.org">Nominatim</Link>
            </Credit>
          </dl>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Credit({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Link({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-foreground hover:text-primary hover:underline"
    >
      {children}
    </a>
  );
}
