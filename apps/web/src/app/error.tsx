"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/** Route-level error boundary. `retry` re-fetches and re-renders the segment. */
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("errors");
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Button variant="outline" className="self-start" onClick={() => retry()}>
        {t("retry")}
      </Button>
    </main>
  );
}
