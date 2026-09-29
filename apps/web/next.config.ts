import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Locale comes from the NEXT_LOCALE cookie (no /en, /ta, /hi URL prefix), see src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The Dockerfile sets this to get a self-contained server in .next/standalone (small image, no
  // node_modules). Off by default so `npm start` keeps working locally.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
};

export default withNextIntl(nextConfig);
