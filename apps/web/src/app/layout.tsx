import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
// Self-hosted variable fonts (design doc 5.2): no font CDN, no tracking.
// TODO(F5): add @fontsource/noto-sans-tamil and @fontsource/noto-sans-devanagari for TA and HI.
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@/styles/globals.css";
import { Providers } from "@/components/shell/Providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: { default: "DisasterIntel", template: "%s · DisasterIntel" },
  description:
    "A verified, explainable, multilingual disaster intelligence map: what is happening, how sure we are, and what to do.",
  // The app has its own dark and light themes. This tells the Dark Reader extension to leave the
  // page alone: it injects attributes into every SVG before hydration (a hydration-mismatch error
  // in dev) and would double-invert the light theme.
  other: { "darkreader-lock": "true" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // let the map run under notches and rounded corners; floating UI keeps its own margins
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f1729" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    // data-theme is a fallback: the inline script below sets the real value before first paint, and
    // suppressHydrationWarning stops React from complaining that it changed.
    <html lang={locale} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
