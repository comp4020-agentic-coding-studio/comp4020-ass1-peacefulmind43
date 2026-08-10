import { describe, expect, it } from "vitest";
import trainingStats from "../data/training-stats.json";
import { breakdown, predictPrice, SUBURBS } from "../pricing";

// Assignment 1's published spec, sorted (see spec/README.md for the split):
//
// Mechanically checkable, asserted below:
//   - "the visitor does something that changes what they see" — the core
//     interaction is the suburb/bed/bath/car controls. Changing any one of
//     them must change the displayed prediction, so we assert that at the
//     level of the pure computation the controls drive (contract, not the
//     DOM wiring around it).
//   - the model itself must be right. A wrong training pipeline here would
//     undercut the whole prototype's point, so it's checked against a
//     mathematical identity of fixed-effects OLS, not trusted on sight.
//
// Judged by a person at the crit, not testable here:
//   - "one strong idea ... and nothing else" (scope and point of view)
//   - "works at both marking viewports" (visual/layout — verify manually
//     with the dev server at 1920x1080 and 390x844 before shipping)
//
// Covered elsewhere, not re-asserted here:
//   - "deployed and live", "static and client-side" — CI's build/deploy
//     jobs and spec/invariants.test.ts
//   - the OLS solver's own correctness — scripts/ols.test.ts
//   - process evidence (PROCESS.md, CLAUDE.md, reflection) — pnpm check:evidence

describe("house price model", () => {
  it("predicting at a suburb's own average house matches that suburb's real average price", () => {
    // A mathematical property of fixed-effects OLS: the sum of residuals
    // within each dummy group is exactly zero, so the model's prediction at
    // a suburb's own mean bed/bath/car must equal that suburb's real mean
    // sale price (computed independently, by plain averaging, in
    // scripts/train-model.ts). This is computed from training data the
    // model itself was fit on -- not test data -- so it isn't a claim
    // about accuracy on new houses; it's a check that the training
    // pipeline (design matrix, centering, dummy alignment) has no bug, since
    // a bug there would break this identity even though it's guaranteed by
    // the maths whenever the pipeline is right.
    for (const suburb of SUBURBS) {
      const stats = trainingStats[suburb as keyof typeof trainingStats];
      const predicted = predictPrice({ suburb, bed: stats.meanBed, bath: stats.meanBath, car: stats.meanCar });
      expect(predicted).toBeCloseTo(stats.meanPrice, 0);
    }
  });

  it("changing suburb changes the prediction (the core interaction)", () => {
    const house = { bed: 3, bath: 2, car: 1 };
    const cheapest = predictPrice({ ...house, suburb: "Gregory Hills" });
    const priciest = predictPrice({ ...house, suburb: "Mosman" });
    expect(priciest).toBeGreaterThan(cheapest);
    expect(priciest - cheapest).toBeGreaterThan(1_000_000);
  });

  it("changing bed, bath, or car changes the prediction (the core interaction)", () => {
    const base = { suburb: "Auburn", bed: 3, bath: 2, car: 1 };
    expect(predictPrice({ ...base, bed: 4 })).not.toBeCloseTo(predictPrice(base), 0);
    expect(predictPrice({ ...base, bath: 3 })).not.toBeCloseTo(predictPrice(base), 0);
    expect(predictPrice({ ...base, car: 2 })).not.toBeCloseTo(predictPrice(base), 0);
  });

  it("the breakdown's parts always sum to the total prediction", () => {
    const input = { suburb: "Pymble", bed: 5, bath: 3, car: 2 };
    const { base, suburbPremium, bedEffect, bathEffect, carEffect, total } = breakdown(input);
    expect(base + suburbPremium + bedEffect + bathEffect + carEffect).toBeCloseTo(total, 6);
    expect(total).toBeCloseTo(predictPrice(input), 6);
  });
});
