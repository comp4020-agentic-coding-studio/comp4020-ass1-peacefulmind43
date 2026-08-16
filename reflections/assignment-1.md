# Assignment 1 reflection

**The breakthrough that moved the work forward:** the same realization kept
showing up in different shapes. Training the model, I could have just read
the coefficients and decided they looked plausible — instead the training
script writes out `data/training-stats.json`, a second, independently
computed set of numbers, so a real mathematical identity catches a wrong
training bug instead of me eyeballing it. Once the UI was live, I could have
read the listener code and called it correct — instead I drove the actual
page and found the suburb dropdown silently doing nothing, because looking
right and running right are two different questions. Testing keyboard access
the same way pointed the same discipline the other way: the dropdown really
didn't respond to a scripted arrow key, and ruling that in as a headless-tool
quirk rather than a real bug took the same distrust of my own first read.
Wiring up `axe-core` instead of leaving `CLAUDE.md`'s own accessibility
disclaimer alone was the same move again: don't leave a gap unmeasured just
because nothing obviously proves it's broken.

**What this changed about the developer I want to be:** I want "this looks
correct" to stop being a stopping point — in code, in test coverage, and in
whatever checks both. None of these were cases of sloppiness; the code always
read fine. Reading and verifying turned out to be different acts, and the
only way to get the second one is to actually build or run the check, not to
get more confident about the first.
