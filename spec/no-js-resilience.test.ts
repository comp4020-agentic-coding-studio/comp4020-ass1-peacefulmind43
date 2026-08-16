import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { breakdown, SUBURBS } from "../pricing";

// This site has zero external requests (no CDN, no webfonts), so the one
// real slow-connection risk is the gap between HTML parse and the deferred
// module script executing: a real run with the JS blocked showed an empty
// suburb dropdown, sliders defaulted to the browser's 0-100 range, and every
// output blank. index.html now ships static defaults matching what render()
// produces for the reference suburb at bed=3/bath=2/car=1, computed from the
// same breakdown() the live page uses -- not hand-typed -- so a page load
// that's slow, or fails to load the script at all, still shows a real,
// correct prediction instead of a broken-looking shell. main.ts's
// suburbSelect.replaceChildren() then makes the full SUBURBS list
// authoritative over the single pre-seeded option once the script runs.
const html = readFileSync(resolve("dist/index.html"), "utf8");
const dom = new JSDOM(html);
const doc = dom.window.document;

const currency = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const signed = (value: number) => `${value >= 0 ? "+" : ""}${currency.format(value)}`;

describe("index.html: usable before the script loads (slow-connection resilience)", () => {
  it("suburb select isn't empty and defaults to the reference suburb", () => {
    const select = doc.querySelector<HTMLSelectElement>("#suburb")!;
    expect(select.options.length).toBeGreaterThan(0);
    expect(select.value).toBe(SUBURBS[0]);
  });

  it("sliders have a real range and starting value, not the browser's 0-100 default", () => {
    const bed = doc.querySelector<HTMLInputElement>("#bed")!;
    const bath = doc.querySelector<HTMLInputElement>("#bath")!;
    const car = doc.querySelector<HTMLInputElement>("#car")!;
    expect([bed.min, bed.max, bed.value]).toEqual(["1", "6", "3"]);
    expect([bath.min, bath.max, bath.value]).toEqual(["1", "5", "2"]);
    expect([car.min, car.max, car.value]).toEqual(["0", "5", "1"]);
  });

  it("the static price and breakdown text match what the model actually computes for that default state", () => {
    const expected = breakdown({ suburb: SUBURBS[0], bed: 3, bath: 2, car: 1 });

    expect(doc.querySelector("#price-value")!.textContent).toBe(currency.format(expected.total));
    expect(doc.querySelector("#suburb-value")!.textContent).toBe(signed(expected.suburbPremium));
    expect(doc.querySelector("#bed-effect-value")!.textContent).toBe(signed(expected.bedEffect));
    expect(doc.querySelector("#bath-effect-value")!.textContent).toBe(signed(expected.bathEffect));
    expect(doc.querySelector("#car-effect-value")!.textContent).toBe(signed(expected.carEffect));
  });
});
