# Process overview

A Sydney house-price predictor: pick a suburb, drag the bed/bath/car sliders,
and watch a live prediction come out of a model trained on 9,714 real house
sales (2017–2019) across the 30 Sydney suburbs with the most sales in that
period. Below the price, the prediction breaks into signed dollar bars —
suburb, bedrooms, bathrooms, car spaces — all on one shared scale, so the
point is obvious at a glance: which suburb a house sits in moves the price a
lot more than an extra bedroom does.

## The moments that mattered

1. **Proving the model was actually correct without shipping the data it was
   trained on.** The raw CSV is 11MB and I didn't want it in the repo, so the
   spec's identity check — predict at a suburb's own average house, get back
   that suburb's own average sale price, a real property of fixed-effects OLS
   and not something I'm eyeballing — had nothing to check against. The
   training script also writes `data/training-stats.json`: small per-suburb
   averages, computed a completely different way from the OLS solve. That's
   what's committed instead, so the test still catches a real training bug —
   wrong centering, a misaligned dummy column — without the raw data ever
   entering the repo —
   [`9683619`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/9683619),
   [`8ba4c25`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/8ba4c25).
2. **Actually driving the page instead of trusting the listener code, twice,
   and getting a different answer each time.** First pass: operating every
   control with `agent-browser` at both marking viewports caught something
   the code alone hid — the suburb `<select>` changed its own value fine but
   never fired the page's `input`-only listener, so the dropdown silently
   stopped moving the price. Both `input` and `change` are wired on every
   control now —
   [`374e0ff`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/374e0ff).
   Second pass, testing keyboard access the same way: a scripted `ArrowDown`
   on that same `<select>` did nothing, but the same key press had just moved
   the bed slider correctly a few seconds earlier. That points at headless
   Chromium's key handling on a native popup, not the page, so this time there
   was nothing to fix — and saying so honestly felt like the more useful
   result —
   [`f09d56c`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/f09d56c).
3. **Closing a gap the file itself admitted to.** The starter `CLAUDE.md` said
   outright that nothing here measured accessibility. Instead of leaving that
   as a disclaimer, `spec/accessibility.test.ts` now runs `axe-core` against
   the built page as part of `pnpm check` (`color-contrast` turned off — it
   needs real paint, which `jsdom` doesn't have) —
   [`2249267`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/2249267).
4. **Turning "nobody's checking that" into an actual check, on colour this
   time.** `spec/accessibility.test.ts` disables `color-contrast` and says so
   in a comment — but a disabled rule isn't a cleared one. Computing the
   ratio by hand on the breakdown bars' zero-baseline divider found it really
   was under WCAG's floor (`#999` on white, 2.85:1, below the 3:1 a
   meaningful graphical element needs), sitting there unnoticed because
   nothing automated could see it. Darkened to `#767676` (4.54:1) —
   [`333ac13`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-peacefulmind43/commit/333ac13).

## A note on how this week was directed

I picked the topic (a real-data house-price predictor over fixed-effects OLS)
and the point of view (suburb matters more than bed/bath/car) myself. From
there the agent did the data sourcing, the model design, and the UI build, and
I reviewed the actual trained coefficients and the actual rendered page — not
just green checks — before signing off on anything.
