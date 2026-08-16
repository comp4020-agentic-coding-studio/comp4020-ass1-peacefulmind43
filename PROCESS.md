# Process overview

A Sydney house-price predictor: pick a suburb, drag the bed/bath/car sliders,
and watch a live prediction from a model trained on 9,714 real house sales
(2017–2019) across Sydney's 30 highest-volume suburbs. The prediction breaks
into signed dollar bars — suburb, bedrooms, bathrooms, car spaces — on one
shared scale, so the point is obvious at a glance: suburb moves the price far
more than an extra bedroom does.

## The moments that mattered

1. **Proving the model correct in two stages before trusting it on real
   data.** The hand-rolled OLS solver first had to recover exact coefficients
   on a noiseless synthetic line and match a textbook regression on a
   scattered one — a wrong transpose or pivot shows up here as a wrong
   number —
   [`1343f94`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/1343f94).
   The trained model needed the same discipline: the raw CSV is 11MB and I
   didn't want it in the repo, so the identity check — predict at a suburb's
   own average house, get back its own average sale price — had nothing to
   check against. The training script also writes `data/training-stats.json`,
   per-suburb averages computed a different way from the OLS solve, committed
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
   slider. That points at headless Chromium's key handling on a native
   popup, not the page — nothing to fix, and saying so felt more useful —
   [`f09d56c`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/f09d56c).
3. **Closing a gap the file admitted to, then finding the fix had its own
   blind spot.** The starter `CLAUDE.md` said outright that nothing here
   measured accessibility, so `spec/accessibility.test.ts` now runs
   `axe-core` against the built page in `pnpm check` —
   [`2249267`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/2249267) —
   but `color-contrast` is disabled there because `jsdom` can't paint, and a
   disabled rule isn't a cleared one. Checking the breakdown bars' divider by
   hand found it under WCAG's 3:1 floor, but against the wrong background
   (white, not the page's actual `#f7f5f0`) — wrong number, right verdict.
   `spec/contrast.test.ts` now runs the same formula against the real hex
   values in the built CSS — `#999` was 2.61:1, fixed to `#767676`
   (4.17:1) — so a future regression fails `pnpm check` on its own —
   [`333ac13`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/333ac13),
   [`394d376`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/394d376).
4. **A gap axe-core can't see: what a whole interaction sounds like, not one
   render.** The price output announces its own updates, but the four
   breakdown bars beneath it — the page's whole "why" — had no `aria-live`,
   so a screen reader user dragging a slider heard the total change and
   nothing explaining it. Fixed on all four, pinned with a structural test —
   no paint needed, unlike contrast — that fails if a future edit drops it —
   [`4a4a976`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/4a4a976).

## A note on how this week was directed

I picked the topic (a real-data house-price predictor over fixed-effects OLS)
and the point of view (suburb matters more than bed/bath/car) myself; the
agent did the data sourcing, model design, and UI build, and I reviewed the
actual coefficients and rendered page — not just green checks — before
signing off.
