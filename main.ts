import model from "./data/model.json";
import { breakdown, SLIDER_RANGES, SUBURBS } from "./pricing";

const suburbSelect = document.querySelector<HTMLSelectElement>("#suburb")!;
const bedInput = document.querySelector<HTMLInputElement>("#bed")!;
const bathInput = document.querySelector<HTMLInputElement>("#bath")!;
const carInput = document.querySelector<HTMLInputElement>("#car")!;
const bedValue = document.querySelector<HTMLOutputElement>("#bed-value")!;
const bathValue = document.querySelector<HTMLOutputElement>("#bath-value")!;
const carValue = document.querySelector<HTMLOutputElement>("#car-value")!;
const priceValue = document.querySelector<HTMLOutputElement>("#price-value")!;
const baseCaption = document.querySelector<HTMLElement>("#base-caption")!;

const currency = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

function signedCurrency(value: number): string {
  return `${value >= 0 ? "+" : ""}${currency.format(value)}`;
}

for (const suburb of SUBURBS) {
  const option = document.createElement("option");
  option.value = suburb;
  option.textContent = suburb;
  suburbSelect.append(option);
}
suburbSelect.value = SUBURBS[0];

function applyRange(input: HTMLInputElement, [min, max]: number[], value: number) {
  input.min = String(min);
  input.max = String(max);
  input.step = "1";
  input.value = String(value);
}
applyRange(bedInput, SLIDER_RANGES.bed, 3);
applyRange(bathInput, SLIDER_RANGES.bath, 2);
applyRange(carInput, SLIDER_RANGES.car, 1);

// Every bar shares one dollar scale (the largest swing any control can
// produce), so a suburb-length bar and a bedroom-length bar are directly
// comparable -- that comparison is the whole point of the prototype.
const suburbMagnitudes = Object.values(model.suburbOffset).map(Math.abs);
const bedMagnitude = model.betaBed * Math.max(...SLIDER_RANGES.bed.map((v) => Math.abs(v - model.meanBed)));
const bathMagnitude = model.betaBath * Math.max(...SLIDER_RANGES.bath.map((v) => Math.abs(v - model.meanBath)));
const carMagnitude = model.betaCar * Math.max(...SLIDER_RANGES.car.map((v) => Math.abs(v - model.meanCar)));
const scale = Math.max(...suburbMagnitudes, bedMagnitude, bathMagnitude, carMagnitude);

function setBar(name: string, value: number, valueEl: HTMLElement) {
  const negFill = document.querySelector<HTMLElement>(`#${name}-neg .bar-fill`)!;
  const posFill = document.querySelector<HTMLElement>(`#${name}-pos .bar-fill`)!;
  const pct = `${Math.min(100, (Math.abs(value) / scale) * 100)}%`;
  negFill.style.width = value < 0 ? pct : "0%";
  posFill.style.width = value >= 0 ? pct : "0%";
  valueEl.textContent = signedCurrency(value);
}

const referenceSuburb = SUBURBS[0];
baseCaption.textContent =
  `${currency.format(model.intercept)} is the model's estimate for ${referenceSuburb} at the training set's ` +
  `average house (${model.meanBed.toFixed(1)} bed, ${model.meanBath.toFixed(1)} bath, ${model.meanCar.toFixed(1)} car) ` +
  "-- the baseline every bar below adjusts away from.";

function render() {
  const input = {
    suburb: suburbSelect.value,
    bed: Number(bedInput.value),
    bath: Number(bathInput.value),
    car: Number(carInput.value),
  };
  const result = breakdown(input);

  bedValue.textContent = String(input.bed);
  bathValue.textContent = String(input.bath);
  carValue.textContent = String(input.car);
  priceValue.textContent = currency.format(result.total);

  setBar("suburb", result.suburbPremium, document.querySelector<HTMLElement>("#suburb-value")!);
  setBar("bed", result.bedEffect, document.querySelector<HTMLElement>("#bed-effect-value")!);
  setBar("bath", result.bathEffect, document.querySelector<HTMLElement>("#bath-effect-value")!);
  setBar("car", result.carEffect, document.querySelector<HTMLElement>("#car-effect-value")!);
}

// Both events are wired because <select> reliably fires "change" but not
// every input method fires "input" on it, while the range sliders want
// "input" for a live update as they're dragged rather than only on release.
for (const control of [suburbSelect, bedInput, bathInput, carInput]) {
  control.addEventListener("input", render);
  control.addEventListener("change", render);
}
render();
