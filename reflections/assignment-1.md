# Assignment 1 reflection

**The breakthrough that moved the work forward:** the same realization kept
showing up in different shapes, and the last time it showed up it was aimed
at me. Training the model, I could have just read the coefficients and
decided they looked plausible — instead the training script writes out
`data/training-stats.json`, a second, independently computed set of numbers,
so a real mathematical identity catches a wrong training bug instead of me
eyeballing it. Once the UI was live, I could have read the listener code and
called it correct — instead I drove the actual page and found the suburb
dropdown silently doing nothing, because looking right and running right are
two different questions. Testing keyboard access pointed the same discipline
the other way: the dropdown really didn't respond to a scripted arrow key,
and ruling that in as a headless-tool quirk took the same distrust of my own
first read. The sharpest version was checking a colour contrast ratio by hand
and fixing it — only to realise later I'd checked it against the wrong
background. The number was wrong even though the fix happened to hold, so I
stopped trusting my own arithmetic and wrote a test that computes it instead.

**What this changed about the developer I want to be:** I want "this looks
correct" to stop being a stopping point — in code, in test coverage, and in
my own checking, too. None of these were cases of sloppiness; everything read
fine, including my own maths. Reading and verifying turned out to be
different acts, and the only way to get the second one is to actually build
or run the check — even, especially, on myself — not to get more confident
about the first.
