// Runtime inference only -- the model itself (an OLS fit of price on suburb
// + bed + bath + car) was trained offline by scripts/train-model.ts, which
// wrote the coefficients below into data/model.json. This file does no
// fitting, just the arithmetic a trained linear model needs at prediction
// time, so nothing here needs a numeric solver shipped to the browser.
import model from "./data/model.json";

export interface PriceInput {
  suburb: string;
  bed: number;
  bath: number;
  car: number;
}

export interface PriceBreakdown {
  base: number;
  suburbPremium: number;
  bedEffect: number;
  bathEffect: number;
  carEffect: number;
  total: number;
}

export const SUBURBS: string[] = model.suburbs;
export const SLIDER_RANGES = model.sliderRanges;

// "base" is the reference suburb's price for a house at the training set's
// mean bed/bath/car; every other term is a signed adjustment away from that,
// so the parts always add up to the total by construction (see the "sums
// to the total" spec test).
export function breakdown(input: PriceInput): PriceBreakdown {
  const suburbPremium = model.suburbOffset[input.suburb as keyof typeof model.suburbOffset] ?? 0;
  const bedEffect = model.betaBed * (input.bed - model.meanBed);
  const bathEffect = model.betaBath * (input.bath - model.meanBath);
  const carEffect = model.betaCar * (input.car - model.meanCar);

  return {
    base: model.intercept,
    suburbPremium,
    bedEffect,
    bathEffect,
    carEffect,
    total: model.intercept + suburbPremium + bedEffect + bathEffect + carEffect,
  };
}

export function predictPrice(input: PriceInput): number {
  return breakdown(input).total;
}
