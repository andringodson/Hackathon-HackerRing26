// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SEVERITIES, SEVERITY_COLOR } from "@/lib/severity";

const css = readFileSync(fileURLToPath(new URL("./tokens.css", import.meta.url)), "utf8");

/** Custom properties declared in the first (dark, default) :root block. */
function darkTokens() {
  const block = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
  );
}

describe("design tokens", () => {
  const tokens = darkTokens();

  it("keeps lib/severity.ts in sync with the --sev-* tokens", () => {
    // MapLibre cannot read CSS variables, so the hexes are duplicated. This catches drift.
    for (const severity of SEVERITIES) {
      expect(tokens[`--sev-${severity}`]?.toLowerCase(), severity).toBe(SEVERITY_COLOR[severity]);
    }
  });

  it("defines the surface, text and accent tokens from the design doc", () => {
    for (const name of [
      "--bg-map-overlay",
      "--bg-panel",
      "--bg-elevated",
      "--border",
      "--text-primary",
      "--text-secondary",
      "--text-muted",
      "--accent",
    ]) {
      expect(tokens[name], name).toBeDefined();
    }
  });

  it("has a light theme that overrides the surfaces and text", () => {
    const light = css.match(/:root\[data-theme="light"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
    for (const name of ["--bg-panel", "--bg-elevated", "--border", "--text-primary", "--accent"]) {
      expect(light, name).toContain(name);
    }
  });
});
