import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import axe from "axe-core";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Runs against the BUILT site, same reasoning as invariants.test.ts: what
// ships is what's checked. CLAUDE.md names accessibility as a sensor nobody
// had wired up yet -- this is that sensor, run automatically with everything
// else instead of relying on someone remembering to reach for axe by hand.
const DIST = resolve("dist");

function htmlFiles(dir: string = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

const pages = htmlFiles().map((path) => ({
  name: relative(DIST, path),
  html: readFileSync(path, "utf8"),
}));

// color-contrast needs real layout/paint to compute rendered colors; jsdom
// has no rendering engine, so axe can't evaluate it here and the rule is
// disabled rather than producing a false pass or false fail. Contrast is a
// screenshot-and-look check, same as the rendered-bar-legibility rule already
// in CLAUDE.md's "Rules learned this week".
const JSDOM_UNSUPPORTED_RULES = ["color-contrast"];

describe("accessibility: every page", () => {
  it("built at least one page", () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  for (const { name, html } of pages) {
    it(`${name} has no axe violations`, async () => {
      const dom = new JSDOM(html, { url: "http://localhost/" });
      // Without a real browser global, axe-core deduces window/document from
      // the context node's `.ownerDocument` -- which only an Element has, not
      // a Document -- so the root <html> element is passed, not the document.
      const results = await axe.run(dom.window.document.documentElement, {
        rules: Object.fromEntries(JSDOM_UNSUPPORTED_RULES.map((id) => [id, { enabled: false }])),
      });

      const summary = results.violations.map(
        (v) => `${v.id} (${v.impact}): ${v.help} -- ${v.nodes.length} node(s)\n  ${v.helpUrl}`,
      );
      expect(results.violations, summary.join("\n")).toEqual([]);
    });
  }
});

// axe-core doesn't flag this: it checks the DOM as it renders, not what a
// screen reader hears across an interaction. The price output announces its
// own updates (aria-live="polite"), but the four breakdown bars below it --
// the whole "why" of the page -- didn't, so a screen reader user dragging a
// slider would hear the total change and nothing explaining it. This test
// pins the fix structurally (DOM, no paint needed) so a future edit that
// drops the attribute fails here instead of only showing up in a screen
// reader nobody ran.
describe("index.html: breakdown values announce to screen readers", () => {
  const home = pages.find((p) => p.name === "index.html");

  it("exists", () => {
    expect(home).toBeTruthy();
  });

  const dynamicOutputIds = [
    "price-value",
    "suburb-value",
    "bed-effect-value",
    "bath-effect-value",
    "car-effect-value",
  ];

  for (const id of dynamicOutputIds) {
    it(`#${id} is in an aria-live region`, () => {
      const dom = new JSDOM(home!.html, { url: "http://localhost/" });
      const el = dom.window.document.getElementById(id);
      expect(el, `#${id} not found in built index.html`).toBeTruthy();
      expect(
        el!.closest("[aria-live]"),
        `#${id} has no aria-live attribute (or ancestor) -- its updates are silent to screen readers`,
      ).toBeTruthy();
    });
  }
});

// CLAUDE.md's keyboard rule explains why a scripted ArrowDown on the suburb
// <select> did nothing in headless Chromium: that tool can't dispatch key
// events into a native <select>'s OS-level popup, which is a limitation of
// automating that control, not of this page. The suburb select and all three
// sliders are plain native form controls with only input/change listeners
// (see main.ts) -- their keyboard behaviour is the browser's, not this app's,
// so it can only break here if custom JS starts intercepting key events. This
// pins that guarantee so it fails loudly if that ever happens.
describe("main.ts: interactive controls keep their native keyboard behaviour", () => {
  const source = readFileSync(resolve("main.ts"), "utf8");

  it("attaches no keydown/keyup/keypress listener that could override a control's default key handling", () => {
    expect(source).not.toMatch(/key(down|up|press)/i);
  });

  it("never calls preventDefault, the only way this file could block native keyboard behaviour", () => {
    expect(source).not.toMatch(/preventDefault/);
  });
});
