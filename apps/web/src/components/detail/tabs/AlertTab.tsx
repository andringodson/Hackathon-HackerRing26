import { TabPlaceholder } from "@/components/detail/tabs/TabPlaceholder";

/**
 * TODO(F6), responders only: the alert composer. AI draft, editable text, language tabs, audience
 * polygon drawn on the map, approve and send, with an audit log. Uses types/alert.ts.
 * Load it lazily (next/dynamic); the public bundle should not carry it.
 */
export function AlertTab() {
  return <TabPlaceholder phase="F6" />;
}
