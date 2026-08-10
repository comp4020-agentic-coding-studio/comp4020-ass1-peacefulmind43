import { describe, expect, it } from "vitest";
import { solveOLS } from "./ols";

describe("solveOLS", () => {
  it("recovers exact coefficients on a noiseless line (the hand-computable case)", () => {
    // y = 3 + 2x exactly, no noise -- OLS on data that lies exactly on a line
    // must recover that line's own coefficients, not merely something close.
    // This is the pin: if the normal-equations solver has a real bug (wrong
    // transpose, wrong pivot, misaligned columns), this is where it shows up
    // as a wrong number rather than a plausible-looking one.
    const x = [
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
    ];
    const y = [3, 5, 7, 9];

    const [intercept, slope] = solveOLS(x, y);

    expect(intercept).toBeCloseTo(3, 9);
    expect(slope).toBeCloseTo(2, 9);
  });

  it("matches the textbook closed-form slope/intercept on data with real scatter", () => {
    // Five points with genuine scatter (not on any line). The closed-form
    // simple-regression formulas (slope = cov(x,y)/var(x), intercept =
    // ybar - slope*xbar) are hand-computable from these numbers, so this
    // checks the general multi-column solver against that known-correct
    // single-predictor answer.
    const xs = [1, 2, 3, 4, 5];
    const ys = [2, 3, 5, 4, 6];
    const xBar = xs.reduce((a, b) => a + b, 0) / xs.length;
    const yBar = ys.reduce((a, b) => a + b, 0) / ys.length;
    const covariance = xs.reduce((sum, xi, i) => sum + (xi - xBar) * (ys[i] - yBar), 0);
    const variance = xs.reduce((sum, xi) => sum + (xi - xBar) ** 2, 0);
    const expectedSlope = covariance / variance;
    const expectedIntercept = yBar - expectedSlope * xBar;

    const x = xs.map((xi) => [1, xi]);
    const [intercept, slope] = solveOLS(x, ys);

    expect(slope).toBeCloseTo(expectedSlope, 9);
    expect(intercept).toBeCloseTo(expectedIntercept, 9);
  });
});
