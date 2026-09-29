"use client";

import { Bookmark, ChevronLeft, List, SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FilterBar } from "@/components/events/FilterBar";
import { LiveFeed } from "@/components/events/LiveFeed";
import { Sidebar, SidebarHeader } from "@/components/sidebar/Sidebar";
import { SidebarRail } from "@/components/sidebar/SidebarRail";
import { IconButton } from "@/components/ui/icon-button";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { DATA_SOURCE } from "@/lib/env";
import { LEFT_WIDTH } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";

/** "Events": browse and filter what is happening. Collapses to a rail with shortcuts. */
export function LeftSidebar() {
  const t = useTranslations("sidebar");
  const open = useUiStore((s) => s.leftOpen);
  const toggle = useUiStore((s) => s.toggleLeft);
  const setOpen = useUiStore((s) => s.setLeftOpen);
  const { data, isError } = useLiveEvents();
  const count = data?.length;
  const live = DATA_SOURCE !== "demo" && !isError;

  return (
    <Sidebar
      side="left"
      open={open}
      width={LEFT_WIDTH}
      label={t("events")}
      rail={
        <SidebarRail side="left" expandLabel={t("expand")} onExpand={toggle}>
          <span className="relative">
            <IconButton
              label={t("events")}
              icon={List}
              tooltipSide="right"
              onClick={() => setOpen(true)}
            />
            {count ? <CountBadge count={count} /> : null}
          </span>
          <IconButton
            label={t("filters")}
            icon={SlidersHorizontal}
            tooltipSide="right"
            onClick={() => setOpen(true)}
          />
          {/* TODO(F5): saved areas need accounts */}
          <IconButton label={t("savedAreas")} icon={Bookmark} tooltipSide="right" disabled />
        </SidebarRail>
      }
    >
      <SidebarHeader
        title={t("events")}
        meta={
          count != null && (
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  live ? "live-dot bg-sev-low" : "bg-sev-moderate",
                )}
              />
              <HeaderCount count={count} />
            </span>
          )
        }
      >
        <IconButton label={t("collapse")} icon={ChevronLeft} tooltipSide="right" onClick={toggle} />
      </SidebarHeader>
      <FilterBar />
      <LiveFeed />
    </Sidebar>
  );
}

function HeaderCount({ count }: { count: number }) {
  const locale = useLocale();
  return (
    <span className="numeric text-xs text-muted-foreground">
      {new Intl.NumberFormat(locale).format(count)}
    </span>
  );
}

/** Decorative: the Events button's tooltip names the panel, and the open panel lists the events. */
function CountBadge({ count }: { count: number }) {
  return (
    <span
      aria-hidden
      className="numeric pointer-events-none absolute -top-1 -right-1 min-w-4 rounded-full bg-primary px-1 text-center text-[9px] leading-4 font-semibold text-primary-foreground"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
