# Process overview

A Sydney house-price predictor: pick a suburb, drag the bed/bath/car sliders,
and watch a live prediction from a model trained on 9,714 real house sales
(2017–2019) across Sydney's 30 highest-volume suburbs. The prediction breaks
into signed dollar bars on one shared scale: the gap between the cheapest and
priciest surveyed suburb is worth more than five extra bedrooms, the biggest
swing the sliders allow.

## The moments that mattered

1. **Proving the model correct in two stages before trusting it on real
   data.** The hand-rolled OLS solver first had to recover exact coefficients
   on a noiseless synthetic line and match a textbook regression on a
   scattered one — a wrong transpose or pivot shows up here as a wrong
   number —
   [`1343f94`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/1343f94).
   The trained model needed the same discipline: the raw CSV is 11MB and I
   didn't want it in the repo, so the identity check had nothing to check
   against. The training script also writes `data/training-stats.json` —
   per-suburb averages computed independently of the OLS solve, committed
   instead — so the test still catches a real training bug without the raw
   data entering the repo —
   [`9683619`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/9683619),
   [`8ba4c25`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/8ba4c25).
2. **Actually driving the page instead of trusting the listener code,
   twice.** First pass: operating every control with `agent-browser` caught
   something the code alone hid — the suburb `<select>` changed its own value
   fine but never fired the page's `input`-only listener, so the dropdown
   silently stopped moving the price. Both `input` and `change` are wired now —
   [`374e0ff`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/374e0ff).
   Second pass, testing keyboard access: a scripted `ArrowDown` on that same
   `<select>` did nothing, but the same key press had just moved the bed
   slider — headless Chromium's key handling on a native popup, not the
   page. Nothing to fix, and saying so felt more useful —
   [`f09d56c`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/f09d56c).
3. **Closing a gap this file admitted to, three times over.** `CLAUDE.md`
   said outright that nothing here measured accessibility, so
   `spec/accessibility.test.ts` now runs `axe-core` in `pnpm check` —
   [`2249267`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/2249267).
   `color-contrast` stays disabled since `jsdom` can't paint — a disabled
   rule isn't a cleared one. Checking the bars' divider by hand first got the
   ratio wrong (against white, not the real `#f7f5f0`) — same verdict, wrong
   number — so `spec/contrast.test.ts` runs the real formula against the
   built CSS instead: `#999` at 2.61:1, fixed to `#767676` at 4.17:1 —
   [`333ac13`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/333ac13),
   [`394d376`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/394d376).
   Axe can't see the third gap: the price output announced its own updates,
   the four bars beneath it didn't, so a screen reader user heard the total
   change and nothing explaining it. Fixed on all four, pinned structurally —
   [`4a4a976`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/4a4a976).
4. **Testing two failure modes nobody had actually tried: a resize
   mid-drag, and the script not arriving yet.** Resizing 1920×1080 to
   390×844 mid-drag kept the price live and the layout intact at both — no
   bug, but worth checking rather than assuming. Blocking the JS bundle found
   a real one: the suburb dropdown was empty, sliders sat at the browser's
   default 0–100 range, every price and bar blank — a slow connection would
   show exactly that gap between HTML parsing and the module script running.
   `index.html` now ships the same default state `render()` produces,
   computed from `breakdown()` rather than typed by hand, with `main.ts`
   staying authoritative once the script runs, pinned so a future retrain
   that drifts fails `pnpm check` —
   [`1f62c39`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/1f62c39).

## A note on how this week was directed

I picked the topic (a house-price predictor over fixed-effects OLS) and the
point of view myself; the agent did the data sourcing, model design, and UI
build, and I reviewed the actual coefficients and rendered page — not just
green checks — before signing off.
