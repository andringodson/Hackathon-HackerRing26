import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";

type PageName =
  | "report"
  | "login"
  | "analytics"
  | "reports"
  | "adminSources"
  | "adminUsers"
  | "adminSettings";

/**
 * Stand-in for routes that are planned but not built. Says what the page is for and which build
 * phase brings it, so nobody mistakes a blank route for a bug. Delete it as each page lands.
 */
export async function PagePlaceholder({ name, phase }: { name: PageName; phase: string }) {
  const t = await getTranslations("pages");
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 p-6">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {t("phase", { phase })}
      </p>
      <h1 className="text-2xl font-semibold">{t(`${name}.title`)}</h1>
      <p className="text-muted-foreground">{t(`${name}.description`)}</p>
      <Link href="/" className={buttonVariants({ variant: "outline", className: "self-start" })}>
        {t("backToMap")}
      </Link>
    </main>
  );
}
