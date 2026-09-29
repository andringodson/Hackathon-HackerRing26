"use client";

import { Bookmark, ChevronLeft, List, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterBar } from "@/components/events/FilterBar";
import { LiveFeed } from "@/components/events/LiveFeed";
import { Sidebar, SidebarHeader } from "@/components/sidebar/Sidebar";
import { SidebarRail } from "@/components/sidebar/SidebarRail";
import { IconButton } from "@/components/ui/icon-button";
import { LEFT_WIDTH } from "@/lib/layout";
import { useUiStore } from "@/store/ui.store";

/** "Events": browse and filter what is happening. Collapses to a rail with shortcuts. */
export function LeftSidebar() {
  const t = useTranslations("sidebar");
  const open = useUiStore((s) => s.leftOpen);
  const toggle = useUiStore((s) => s.toggleLeft);
  const setOpen = useUiStore((s) => s.setLeftOpen);

  return (
    <Sidebar
      side="left"
      open={open}
      width={LEFT_WIDTH}
      label={t("events")}
      rail={
        <SidebarRail side="left" expandLabel={t("expand")} onExpand={toggle}>
          <IconButton label={t("events")} icon={List} tooltipSide="right" onClick={() => setOpen(true)} />
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
      <SidebarHeader title={t("events")}>
        <IconButton label={t("collapse")} icon={ChevronLeft} tooltipSide="right" onClick={toggle} />
      </SidebarHeader>
      <FilterBar />
      <LiveFeed />
    </Sidebar>
  );
}
