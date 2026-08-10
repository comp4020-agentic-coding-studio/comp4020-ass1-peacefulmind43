// One-off training script -- run manually (`node scripts/train-model.ts`),
// not part of `pnpm check`. Downloads the raw Sydney house sales CSV (cached
// locally, gitignored, not committed: it's 11MB and its full redistribution
// rights are unclear), fits a small interpretable model, and writes the
// derived result -- coefficients only, no raw rows -- to data/model.json,
// which IS committed and is the only housing data shipped to the browser.
//
// Source: a public mirror of the Kaggle "Sydney House Prices" dataset
// (sales 2000-2019: date, suburb, postcode, price, bed, bath, car, property
// type). See PROCESS.md for the full provenance note.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { solveOLS } from "./ols.ts";

const SOURCE_URL = "https://raw.githubusercontent.com/mbatuhantur/sydney-house-prices/main/SydneyHousePrices.csv";
const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(HERE, ".cache", "sydney-house-prices.csv");
const OUTPUT_PATH = join(HERE, "..", "data", "model.json");
const TRAINING_STATS_PATH = join(HERE, "..", "data", "training-stats.json");

const TOP_SUBURB_COUNT = 30;
const YEARS = new Set(["2017", "2018", "2019"]);
const BED_RANGE = [1, 6] as const;
const BATH_RANGE = [1, 5] as const;
const CAR_RANGE = [0, 5] as const;
const PRICE_RANGE = [150_000, 6_000_000] as const;

interface Sale {
  suburb: string;
  price: number;
  bed: number;
  bath: number;
  car: number;
}

async function loadCsv(): Promise<string> {
  if (existsSync(CACHE_PATH)) return readFileSync(CACHE_PATH, "utf8");
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`failed to download source CSV: HTTP ${response.status}`);
  const text = await response.text();
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, text);
  return text;
}

function inRange(value: number, [min, max]: readonly [number, number]): boolean {
  return value >= min && value <= max;
}

function parseSales(csv: string): Sale[] {
  const lines = csv.split(/\r?\n/);
  const header = lines[0].split(",");
  const col = (name: string) => header.indexOf(name);
  const [dateI, , suburbI, , priceI, bedI, bathI, carI, typeI] = [
    col("Date"),
    col("Id"),
    col("suburb"),
    col("postalCode"),
    col("sellPrice"),
    col("bed"),
    col("bath"),
    col("car"),
    col("propType"),
  ];

  const sales: Sale[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const fields = line.split(",");
    if (fields[typeI] !== "house") continue;
    if (!YEARS.has(fields[dateI].slice(0, 4))) continue;

    const price = Number(fields[priceI]);
    const bed = Number(fields[bedI]);
    const bath = Number(fields[bathI]);
    const car = Number(fields[carI]);
    if (!Number.isFinite(price) || !inRange(price, PRICE_RANGE)) continue;
    if (!Number.isFinite(bed) || !inRange(bed, BED_RANGE)) continue;
    if (!Number.isFinite(bath) || !inRange(bath, BATH_RANGE)) continue;
    if (!Number.isFinite(car) || !inRange(car, CAR_RANGE)) continue;

    sales.push({ suburb: fields[suburbI], price, bed, bath, car });
  }
  return sales;
}

function topSuburbs(sales: Sale[], count: number): string[] {
  const counts = new Map<string, number>();
  for (const sale of sales) counts.set(sale.suburb, (counts.get(sale.suburb) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([suburb]) => suburb)
    .sort();
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

async function main() {
  const sales = parseSales(await loadCsv());
  const suburbs = topSuburbs(sales, TOP_SUBURB_COUNT);
  const suburbSet = new Set(suburbs);
  const training = sales.filter((sale) => suburbSet.has(sale.suburb));

  const meanBed = mean(training.map((s) => s.bed));
  const meanBath = mean(training.map((s) => s.bath));
  const meanCar = mean(training.map((s) => s.car));

  // Reference suburb (alphabetically first) is folded into the intercept;
  // every other suburb gets its own dummy column, so its fitted coefficient
  // is a direct dollar offset from the reference suburb.
  const [referenceSuburb, ...dummySuburbs] = suburbs;

  const designMatrix = training.map((sale) => [
    1,
    ...dummySuburbs.map((suburb) => (sale.suburb === suburb ? 1 : 0)),
    sale.bed - meanBed,
    sale.bath - meanBath,
    sale.car - meanCar,
  ]);
  const targets = training.map((sale) => sale.price);

  const coefficients = solveOLS(designMatrix, targets);
  const [intercept, ...rest] = coefficients;
  const dummyCoefficients = rest.slice(0, dummySuburbs.length);
  const [betaBed, betaBath, betaCar] = rest.slice(dummySuburbs.length);

  const suburbOffset: Record<string, number> = { [referenceSuburb]: 0 };
  dummySuburbs.forEach((suburb, i) => {
    suburbOffset[suburb] = dummyCoefficients[i];
  });

  const model = {
    intercept,
    suburbOffset,
    betaBed,
    betaBath,
    betaCar,
    meanBed,
    meanBath,
    meanCar,
    suburbs,
    sliderRanges: { bed: BED_RANGE, bath: BATH_RANGE, car: CAR_RANGE },
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(model, null, 2)}\n`);

  // Ground truth for the spec's identity check, computed by plain averaging
  // (a different code path than the OLS solve) so it can catch a real bug
  // in the training script -- not committed raw data, just per-suburb
  // aggregates, and not imported by pricing.ts or shipped to the browser.
  const trainingStats: Record<string, { meanPrice: number; meanBed: number; meanBath: number; meanCar: number; count: number }> = {};
  for (const suburb of suburbs) {
    const rows = training.filter((s) => s.suburb === suburb);
    trainingStats[suburb] = {
      meanPrice: mean(rows.map((s) => s.price)),
      meanBed: mean(rows.map((s) => s.bed)),
      meanBath: mean(rows.map((s) => s.bath)),
      meanCar: mean(rows.map((s) => s.car)),
      count: rows.length,
    };
  }
  writeFileSync(TRAINING_STATS_PATH, `${JSON.stringify(trainingStats, null, 2)}\n`);

  console.log(`trained on ${training.length} sales across ${suburbs.length} suburbs`);
  console.log(`reference suburb: ${referenceSuburb} (intercept $${Math.round(intercept).toLocaleString()})`);
  console.log(`bed +1 -> ${Math.round(betaBed).toLocaleString()}, bath +1 -> ${Math.round(betaBath).toLocaleString()}, car +1 -> ${Math.round(betaCar).toLocaleString()}`);
  const sortedOffsets = Object.entries(suburbOffset).sort((a, b) => a[1] - b[1]);
  console.log(`cheapest: ${sortedOffsets[0][0]} (${Math.round(sortedOffsets[0][1]).toLocaleString()})`);
  console.log(`priciest: ${sortedOffsets.at(-1)![0]} (+${Math.round(sortedOffsets.at(-1)![1]).toLocaleString()})`);
}

main();
