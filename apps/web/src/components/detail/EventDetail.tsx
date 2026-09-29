"use client";

import { useTranslations } from "next-intl";
import { EventHeader } from "@/components/detail/EventHeader";
import { AlertTab } from "@/components/detail/tabs/AlertTab";
import { ForecastTab } from "@/components/detail/tabs/ForecastTab";
import { OverviewTab } from "@/components/detail/tabs/OverviewTab";
import { ResourcesTab } from "@/components/detail/tabs/ResourcesTab";
import { SourcesTab } from "@/components/detail/tabs/SourcesTab";
import { TraceTab } from "@/components/detail/tabs/TraceTab";
import { useRole } from "@/components/shell/RoleProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tabsForRole, type DetailTab } from "@/lib/roles";
import { useUiStore } from "@/store/ui.store";
import type { DisasterEvent } from "@/types/event";

/** Header plus tabs. Public users get four tabs; responders and admins get six. */
export function EventDetail({ event }: { event: DisasterEvent }) {
  const t = useTranslations("detail");
  const role = useRole();
  const activeTab = useUiStore((s) => s.activeTab);
  const setActiveTab = useUiStore((s) => s.setActiveTab);

  const tabs = tabsForRole(role);
  // A stale tab (say, Alert after switching to a public view) falls back to Overview.
  const value = tabs.includes(activeTab) ? activeTab : "overview";

  return (
    <>
      <EventHeader event={event} />
      <Tabs value={value} onValueChange={(next) => setActiveTab(next as DetailTab)}>
        <TabsList aria-label={t("label")}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {t(`tabs.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab event={event} />
        </TabsContent>
        <TabsContent value="forecast">
          <ForecastTab />
        </TabsContent>
        <TabsContent value="resources">
          <ResourcesTab />
        </TabsContent>
        <TabsContent value="sources">
          <SourcesTab event={event} />
        </TabsContent>
        {tabs.includes("alert") && (
          <TabsContent value="alert">
            <AlertTab />
          </TabsContent>
        )}
        {tabs.includes("trace") && (
          <TabsContent value="trace">
            <TraceTab />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
