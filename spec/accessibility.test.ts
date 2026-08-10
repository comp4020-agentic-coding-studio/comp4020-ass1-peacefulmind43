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
