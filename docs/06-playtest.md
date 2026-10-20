# Phase 6: Playtest notes

One section per session: what was played, what the player said, what it means for the hypotheses, and what changed.

## Session 1: Thomas, M2 against the bot, on his phone (2026-10-20)

### What Thomas said
1. Building was hard to figure out. He didn't know how to put pieces back once they were on the blueprint. The game kept stopping him from putting pieces in invalid places, even temporarily, and he didn't understand why some placements weren't allowed.
2. The plushies had to stand so high that the whole budget went into getting them up there.
3. He did learn to build better forts, but felt limited: about 90% of the pieces went into stacking up to plushie height.
4. The marble hits too hard. A well-placed shot pushes all three plushies off.
5. The wait before the next shot was too long, because pieces were still moving.
6. Swiping up while building almost closed the app several times.

### What it means
- **H1 (building on a phone is creative, not fiddly): failed in this build.** The causes were a mix of rule and interface, and both can be fixed:
  - **The minimum plushie height (3 cells) was a tax, not a decision.** The rising lava already punishes low plushies, so the rule added cost without adding choice. Building has to leave room for expression (pillar 2, brief: expression).
  - **Refusing a placement without a reason breaks the player's model of the system.** In Norman's terms, the constraint was invisible. People build by trying, so they need to make temporary messes.
  - **Putting pieces back was invisible.**
- **Attack power:** the marble was much heavier than any piece and faster than needed, so one shot could decide a fort. That fights pillar 3 (aim is skill) and the three-volley arc.
- **Pacing:** waiting for full rest between shots made each turn drag. The rest only matters at the end of a turn, when you look at what you did.
- **Phone:** building interfaces must keep drags away from the screen edges that the operating system owns.
- **Encouraging:** he learned to build better forts within one session, so the building has depth to discover (H3).

### What changed (same day)
| Problem | Change |
|---|---|
| Minimum height too costly | Plushies stand at least **2** cells up (was 3). The lava rises only **between** volleys (to 1, then 2). Before, it also rose after the last volley and quietly took every plushie below 3 |
| Refusals without reasons | **Place anything anywhere.** A piece that breaks a rule turns red with a short reason ("blocks Hoppel's sky", "overlaps another piece", "Brumm too low: lift above the line"). Test waits only for overlaps; Ready names the first thing to fix |
| Putting pieces back | While you carry a piece, the toy box turns into a "Drop here to put it back" target |
| Floating pieces | After every change the blueprint settles: pieces rest on whatever is under them |
| Toy-box slots moved | Slots keep their place all build long; empty ones grey out |
| Marble too strong | Density 8 → 4 and top speed 20 → 16 m/s (still reaches the back of the rug). **Measured:** 225 shots per fort at every angle and power into the three bot forts. Shots taking out all three plushies dropped from 4 to 0; shots taking two or more dropped from 28 to 7 |
| Slow next shot | The next marble is ready 1.6 s after the hit, while the fort still settles. The turn ends once the fort is quiet (at most 3 s) |
| Swipe-home while building | The toy box sits 22 px above the bottom edge. Tap a piece in the box to take it out, then drag it on the rug |
| Hard to learn | A how-to card before the first build. Plus a web-app manifest and the Hoppel icon, so "Add to Home Screen" runs fullscreen |

### Open questions for session 2
- Does building now feel like expression, and how long does it take (the clock in the top bar)?
- Is the marble now too weak, so matches end 3–3 and get decided by the tiebreak (H7)?
- Is a budget of 30 right, now that height costs less?
