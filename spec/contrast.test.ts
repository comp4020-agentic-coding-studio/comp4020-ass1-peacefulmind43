import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// axe-core's color-contrast rule is disabled in accessibility.test.ts because
// jsdom can't paint, so nothing there checks colour. This is that check,
// built a different way: WCAG relative luminance is a closed-form formula, so
// it doesn't need real layout -- just the hex values the built CSS actually
// ships. Reads dist/, same "what ships is what's checked" reasoning as
// accessibility.test.ts, so a colour that only looked right in styles.css but
// got mangled by the build still fails here.
const DIST = resolve("dist");

function builtCss(): string {
  const assets = resolve(DIST, "assets");
  return readdirSync(assets)
    .filter((name) => name.endsWith(".css"))
    .map((name) => readFileSync(join(assets, name), "utf8"))
    .join("\n");
}

function normalizeHex(hex: string): string {
  return hex.length === 3
    ? hex
        .split("")
        .map((c) => c + c)
        .join("")
    : hex;
}

function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// WCAG 2.x contrast ratio: (lighter + 0.05) / (darker + 0.05), 1:1 to 21:1.
function contrastRatio(hexA: string, hexB: string): number {
  const [lighter, darker] = [luminance(normalizeHex(hexA)), luminance(normalizeHex(hexB))].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Pull the value straight out of the built CSS by selector + property, so
// this fails the moment a colour actually shipped changes -- it checks the
// artifact, not a copy of today's values pasted into this file.
function colorOf(css: string, selector: string, property: "color" | "background"): string {
  const block = css.match(new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`));
  if (!block) throw new Error(`selector not found in built CSS: ${selector}`);
  const declaration = block[1].match(
    new RegExp(`${property}:\\s*#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})`),
  );
  if (!declaration) throw new Error(`${property} not found in ${selector}`);
  return declaration[1].toLowerCase();
}

describe("contrast ratio (WCAG relative luminance)", () => {
  it("pins the formula against hand-computable cases", () => {
    expect(contrastRatio("000000", "ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("767676", "767676")).toBeCloseTo(1, 5);
  });

  const css = builtCss();
  const BG = colorOf(css, "body", "background");

  it("body text meets 4.5:1 against the page background", () => {
    expect(contrastRatio(colorOf(css, "body", "color"), BG)).toBeGreaterThanOrEqual(4.5);
  });

  it("stat and bar labels meet 4.5:1 against the page background", () => {
    expect(contrastRatio(colorOf(css, ".stat-label", "color"), BG)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colorOf(css, ".bar-label", "color"), BG)).toBeGreaterThanOrEqual(4.5);
  });

  it("the breakdown bars' zero-baseline divider meets 3:1 (non-text graphical element)", () => {
    expect(contrastRatio(colorOf(css, ".bar-center", "background"), BG)).toBeGreaterThanOrEqual(3);
  });

  it("the signed bar fills meet 3:1 (non-text graphical elements)", () => {
    expect(contrastRatio(colorOf(css, ".bar-fill-neg", "background"), BG)).toBeGreaterThanOrEqual(
      3,
    );
    expect(contrastRatio(colorOf(css, ".bar-fill-pos", "background"), BG)).toBeGreaterThanOrEqual(
      3,
    );
  });
});
