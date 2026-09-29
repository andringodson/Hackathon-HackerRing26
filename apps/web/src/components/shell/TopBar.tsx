"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageMenu } from "@/components/shell/LanguageMenu";
import { LocationSearch } from "@/components/shell/LocationSearch";
import { useRole } from "@/components/shell/RoleProvider";
import { SettingsMenu } from "@/components/shell/SettingsMenu";
import { UserMenu } from "@/components/shell/UserMenu";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { canSeeAgentTools } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";

/**
 * The slim floating bar: menu, name, search, and a few icons. It sits between the open sidebars
 * (--inset-* keep it clear of them) and never covers them.
 * TODO(F7): optionally hide while the map is being dragged.
 */
export function TopBar() {
  const t = useTranslations("topbar");
  const tApp = useTranslations("app");
  const role = useRole();
  const toggleLeft = useUiStore((s) => s.toggleLeft);

  return (
    <header
      className={cn(
        "glass fixed top-3 z-30 flex h-12 items-center gap-1 rounded-lg px-1.5 transition-[left,right] duration-200 ease-out",
        "right-[calc(var(--inset-right)+12px)] left-[calc(var(--inset-left)+12px)]",
        // On phones the panels are sheets under the bar, so the bar always spans the screen.
        "max-md:right-3 max-md:left-3",
      )}
    >
      <IconButton label={t("toggleEvents")} icon={Menu} onClick={toggleLeft} />
      <span className="hidden px-1 text-sm font-semibold sm:inline">{tApp("name")}</span>

      <LocationSearch />

      <div className="flex shrink-0 items-center gap-0.5">
        {canSeeAgentTools(role) && <AgentsButton />}
        <SettingsMenu />
        <LanguageMenu />
        <UserMenu />
      </div>
    </header>
  );
}

/** Responder-only: opens the agent activity drawer (also the "A" key). */
function AgentsButton() {
  const t = useTranslations("topbar");
  const open = useUiStore((s) => s.agentDrawerOpen);
  const toggle = useUiStore((s) => s.toggleAgentDrawer);
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={open}
      aria-keyshortcuts="A"
      onClick={toggle}
      className="px-2"
    >
      {/* TODO(F6): reflect pipeline health here (idle, running, error) */}
      <span aria-hidden className="size-2 rounded-full bg-subtle" />
      <span className="max-md:sr-only">{t("agents")}</span>
    </Button>
  );
}
