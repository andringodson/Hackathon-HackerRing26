"use client";

import { LayoutDashboard, LogIn, Map, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRole } from "@/components/shell/RoleProvider";
import { IconButton } from "@/components/ui/icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Account menu. TODO(F6): show the signed-in user, their role and a sign-out action, and only
 * offer the dashboard to responders.
 */
export function UserMenu() {
  const t = useTranslations("topbar");
  const role = useRole();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label={t("account")} icon={User} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {role === "public" ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/login">
                <LogIn aria-hidden />
                {t("signIn")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <LayoutDashboard aria-hidden />
                {t("dashboard")}
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/">
              <Map aria-hidden />
              {t("publicMap")}
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
