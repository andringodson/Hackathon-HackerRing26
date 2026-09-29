import { useTranslations } from "next-intl";

/** Shown by tabs that are planned but not built. `phase` is the build-plan phase (F1 to F7). */
export function TabPlaceholder({ phase }: { phase: string }) {
  const t = useTranslations("detail");
  return <p className="text-sm text-muted-foreground">{t("notBuilt", { phase })}</p>;
}
