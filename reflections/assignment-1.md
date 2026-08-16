# Assignment 1 reflection

The same realisation kept showing up in different shapes this week, and by
the end it was aimed at me. Training the model, I could have just looked at
the coefficients and decided they seemed plausible. Instead the training
script writes out a second file, `data/training-stats.json` - per-group
means from plain averaging, a separate code path from the OLS solve - so a
real mathematical identity catches a wrong training bug instead of me
eyeballing it.

Once the UI was running, I could have read the listener code and called it
done. Instead I drove the page myself and found the suburb dropdown
silently doing nothing, because looking right and running right turned out
to be two different questions. Testing keyboard access pointed the same
lesson in a different direction: the dropdown didn't respond to a
scripted arrow key, and working out it was a headless-tool quirk, not a
bug, took the same distrust of my own first read.

The sharpest version was checking a colour contrast ratio by hand and
"fixing" it, only to realise later I'd checked it against the wrong
background. The number was wrong even though the fix happened to hold.
That's when I stopped trusting my own arithmetic and wrote a test that
computes it instead.

What I want out of this, going forward, is for "this looks correct" to stop
being a stopping point - in code, in test coverage, and in my own checking.
None of these were cases of me being sloppy. Everything read fine at the
time, including my own maths. Reading something and verifying it are
different acts, and the only way to do that is to build or run the check
yourself, even on your own work, instead of getting more confident about
the first.
