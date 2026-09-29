"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { EventDetail } from "@/components/detail/EventDetail";
import { Sidebar, SidebarHeader } from "@/components/sidebar/Sidebar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvent } from "@/hooks/useEvent";
import { RIGHT_WIDTH } from "@/lib/layout";
import { clearSelection } from "@/store/actions";
import { useMapStore } from "@/store/map.store";
import { useUiStore } from "@/store/ui.store";

/**
 * "Event detail": opens when an event is selected, closes with the X, Esc, or a click on empty
 * map. Its own header only shows for the empty, loading and error states; a loaded event brings
 * its own (EventHeader).
 */
export function RightSidebar() {
  const t = useTranslations("detail");
  const tFeed = useTranslations("feed");
  const open = useUiStore((s) => s.rightOpen);
  const selectedId = useMapStore((s) => s.selectedEventId);
  const { data: event, isPending, isError, refetch } = useEvent(selectedId);

  return (
    <Sidebar
      side="right"
      open={open}
      width={RIGHT_WIDTH}
      label={t("label")}
      onDismiss={clearSelection}
    >
      {selectedId !== null && event ? (
        <EventDetail event={event} />
      ) : (
        <>
          <SidebarHeader title={t("label")}>
            <IconButton label={t("close")} icon={X} tooltipSide="left" onClick={clearSelection} />
          </SidebarHeader>
          <div className="space-y-3 p-4">
            {selectedId === null ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            ) : isPending ? (
              <div aria-busy className="space-y-3">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : isError ? (
              <div role="alert" className="space-y-3 text-sm">
                <p>{t("loadError")}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  {tFeed("retry")}
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </Sidebar>
  );
}
