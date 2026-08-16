# Process overview

A Sydney house-price predictor: pick a suburb, drag the bed/bath/car
sliders, and get a live prediction from a model trained on 9,714 real house
sales (2017-2019) across Sydney's 30 highest-volume suburbs. The prediction
splits into signed dollar bars on one shared scale - the gap between the
cheapest and priciest suburb here is worth more than five extra bedrooms,
the biggest swing the sliders allow.

## The moments that mattered

1. I proved the model correct before trusting it on real data, in two
   stages. The hand-rolled OLS solver first had to recover exact
   coefficients on a noiseless synthetic line, then match a textbook
   regression on a scattered one - a wrong transpose or pivot shows up here
   as a wrong number -
   [`1343f94`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/1343f94).
   The trained model needed the same discipline, but the 11MB raw CSV
   wasn't going in the repo, so there was nothing to check against. Fix:
   the training script also writes `data/training-stats.json`
   - per-suburb averages computed independently of the OLS solve, committed
   instead - so the test still catches a real training bug without the CSV
   entering the repo -
   [`9683619`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/9683619),
   [`8ba4c25`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/8ba4c25).
2. I drove the page instead of trusting the listener code, twice.
   First pass: operating every control with `agent-browser` caught something
   the code alone hid - the suburb `<select>` changed value fine but never
   fired the page's `input`-only listener, so the dropdown silently stopped
   moving the price. Both `input` and `change` are wired now -
   [`374e0ff`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/374e0ff).
   Second pass, testing keyboard access: a scripted `ArrowDown` on that same
   `<select>` did nothing, but the same key had just moved the bed slider a
   second earlier - headless Chromium's key handling on a native popup, not
   the page. Nothing to fix, and saying so felt more useful -
   [`f09d56c`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/f09d56c).
3. This file already admitted a gap, and closing it took three fixes,
   not one. `CLAUDE.md` said outright that nothing here measured
   accessibility, so `spec/accessibility.test.ts` now runs `axe-core` in
   `pnpm check` -
   [`2249267`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/2249267).
   `color-contrast` stays off since `jsdom` can't paint - a disabled rule
   isn't a cleared one. I checked the bars' divider by hand and got the
   ratio wrong - against white, not the real `#f7f5f0` - same verdict, wrong
   number - so `spec/contrast.test.ts` runs the real formula against the
   built CSS instead: `#999` at 2.61:1, fixed to `#767676` at 4.17:1 -
   [`333ac13`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/333ac13),
   [`394d376`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/394d376).
   Axe can't see the third gap: the price output announced its own updates,
   the four bars underneath it didn't, so a screen reader user heard the
   total change and nothing explaining it. Fixed on all four, pinned
   structurally -
   [`4a4a976`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/4a4a976).
4. I tested two failure modes nobody had tried: a resize mid-drag, and the
   script not arriving yet. Resizing 1920x1080 to 390x844 mid-drag kept the
   price live and the layout intact at both - no bug, but worth checking
   rather than assuming. Blocking the JS bundle found a real one: the
   suburb dropdown was empty, sliders sat at the browser's default 0-100
   range, every price and bar blank - a slow connection would show that gap
   between HTML parsing and the module script running.
   `index.html` now ships the same default state `render()` produces,
   computed from `breakdown()` rather than typed by hand, with `main.ts`
   staying authoritative once the script runs, pinned so a future retrain
   that drifts fails `pnpm check` -
   [`1f62c39`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/1f62c39).

## A note on how this week was directed

I picked the topic - a house-price predictor over fixed-effects OLS - and
the point of view myself. The agent did the data sourcing, model design,
and UI build. I reviewed the coefficients and the rendered page myself, not
just green checks, before signing off.
