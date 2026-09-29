"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Role } from "@/lib/roles";

const RoleContext = createContext<Role>("public");

/**
 * The layout is identical for every role; responder tools appear as extra tabs and buttons (design
 * doc section 8). For now the role comes from the route (/ is public, /dashboard is responder).
 * TODO(F6): derive it from the signed-in user and guard /dashboard and /admin.
 */
export function RoleProvider({ role, children }: { role: Role; children: ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRole(): Role {
  return useContext(RoleContext);
}
