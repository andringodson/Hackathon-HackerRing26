import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shell/PagePlaceholder";

export const metadata: Metadata = { title: "Sign in" };

/** Staff sign-in (phase F6). */
export default function LoginPage() {
  return <PagePlaceholder name="login" phase="F6" />;
}
