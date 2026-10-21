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

## Session 2: Thomas, M2 after the playtest-1 fixes (2026-10-20)

### What Thomas said
1. It feels more balanced now.
2. Building was better, but real feedback on it needs a match against an actual friend.
3. The flight-path preview isn't fully accurate any more, which he put down to the softer marble.
4. He has to play a lot more to answer questions like "which pieces does nobody use because they don't help". **Every game played, test games included, should be stored** so feedback can point at a specific game.

### What it means
- **Balance (H7) moved the right way.** Whether the marble is now too weak, so matches end in tiebreaks, needs more matches than one evening. The game log answers it from the data.
- **The preview was measured, and the dots are right.** In free flight the marble stays within 4 cm of the dotted arc at every power and angle. The launcher's book only deflects 85°-plus lobs, which nobody plays. What did change is the input:
  - A full pull was 2 cells of screen, about **50 px on a phone**. A few pixels of wobble as the finger lifts were several percent of power and angle.
  - The softer marble needs more pull to reach the back, so shots now live at the end of that short range.
  - So a shot could leave in a slightly different direction from the dots the player last saw.
- **Building needs a second player.** H1 (expressive building on a phone) can only be judged once two people build against each other. That's the friend test.
- **Questions about the pieces can't be settled from memory.** They need many forts and a count, which is the game log's job.

### What changed (same day)
| Problem | Change |
|---|---|
| Shots don't quite follow the dots | **The shot fires what you saw:** the pull from 50 ms before the finger lifted, not the lift-off wobble. **The pull is longer:** full power takes 110 px of finger travel on every screen (was about 50 px on a phone), so aiming is about twice as fine. Both pulls are logged per shot (`pull` fired, `raw` at lift-off), so the log shows how big the wobble really is |
| Feedback can't point at a game | **Every match is saved** to Cloudflare D1 under a game number (`#12` in the top bar, on the result card). This includes abandoned matches and matches left mid-build. The log holds the draw, both forts as built, build time, how often Test was pressed, and every shot: pull, step, impact, plushies out, pieces knocked off. It also holds the plushies standing after each volley, the result and the device |
| Hard to remember what happened | **Past games** at `/games`: each game with both forts drawn, every shot (angle, power, what it did) and a **Watch** button that replays it. On top, **what goes into forts**: for every piece, how much of what the toy box held was actually used, across all forts people built (answers "which pieces don't help?") |
| Replays need repeatable physics | The ranges now advance only in counted physics steps. Firing, removing knocked-off pieces and slow motion all happen at a step number, never at a clock time. So a shot is fully described by its step and its pull, and a replay repeats the game exactly. Each shot stores a fingerprint of the fort it hit. If a replay's fort differs (possible across devices), the end card says from which shot on |

**Measured:** a replay of a logged match reproduces every fingerprint. Changing one pull by 0.1% is caught at the next shot on the same fort. Not yet measured: whether an iPhone's game replays identically on a Mac. The end card will tell.

### Open questions for session 3 (the friend test)
- **Rematch:** did either of you want another match straight away?
- **Moments:** what made someone laugh, groan or protest? Name the game number.
- **Stuck:** where did someone not know what to do, or ask "why"?
- From the log, not from memory: build times, unused pieces, how matches end (knockout or tiebreak), shot accuracy, match length.

## Session 3: Thomas, the MVP (2026-10-21)

### What Thomas said
1. The plushie sprites are bigger than their hitboxes; the hitbox should reach further up.
2. Building is repetitive, and the budget doesn't make it fun. Drop the budget and randomise the available parts each round instead. The pieces could also get sprites closer to the concept art.
3. The water balloon isn't fun. Instead something like a bomb: those rubber half-balls you turn inside out, which pop and bounce off in a random direction.
4. Two cells of minimum height is still too high: 90% of the pieces still go into propping the plushies up. Make it one. The cones above the plushies may be too restrictive; tone them down a little, and he'll see whether cheat castles get too easy.

### What changed (same day)
| Feedback | Change |
|---|---|
| Hitboxes too small | A plushie's body is 1 × 1.4 cells (was 1 × 1), and its sprite is drawn to fit, with only ears and tips above it. A plushie is out when its **lowest point** touches the rug or the floor, however it's turned, instead of when its centre is low. Its weight stays the same (twice a block) |
| No budget, a random box | **The budget is gone: everything in the box may be used.** The box changes every match (and every Best of Three round): a random 4–6 of the 8 kinds, 18 pieces in the Siege, 15 in the race, 10/14/18 in Best of Three. It always holds enough to lift three plushies. The tray shows only the kinds this box has. Repairs are no longer paid for: up to 3 pieces from what's left, plus 3 tapes |
| Piece sprites | Every piece is illustrated in the concept art's style (`docs/concept/pieces/`, cut by `dev/art/make_pieces.py` to the exact proportions of each physics box). The domino is now 0.75 cells wide, the shape of a real domino and of its drawing (was 0.5) |
| Water balloon → popper | **The popper:** a rubber half-ball. It lands, sits for 0.5–1 s, then pops: a strong shove (with some lift) to everything within 2.4 cells, and it jumps off at speed in a random direction (up to 70° either side of straight up). A tap pops it early. The random direction is seeded by the shot, so replays repeat it. The balloon stays in the code so old games still replay |
| Plushies too high | **Minimum height 1 cell.** To keep that from being a trap, **the lava rises half a cell at a time** (to 0.5, then 1 in the Siege; every 30 s in the race). A whole cell per volley would have drowned every minimum-height plushie before the last volley |
| Cones too strict | **The open-sky V is 20° from vertical (was 30°) and starts at the plushie's waist (was its feet)**, so pieces may come up to a plushie's waist. Watch for cheat castles: plushies walled in up to the waist, reachable only from above |

### What the sims say about the new rules
The bot now builds low forts (plushies at 1–3 cells), and attack and defence have swapped places:
- **Sweep:** of 225 test shots at bot-built forts, these take out at least one plushie. Before this session the old hand-made forts gave 78–87 for each type.

| Marble | Jacks | Spinning top | Popper |
|---|---|---|---|
| 34 | 31 | 41 | 22 |

- **20 bot-vs-bot Sieges:**
  - No fort was wiped, and every match reached volley 3 (before: 80% wipes, 47% early ends). That's the three-volley arc.
  - The catch: 35% went to the tiebreak, with on average 1.8 of 3 plushies standing per fort.
  - Lighter plushies (half the weight) gave 30% wipes but even more tiebreaks (45%), so the weight stays.
- **The popper is a fort-wrecker, not a sniper.** It takes out fewer plushies than the others but knocks pieces around as much. Its job is chaos inside the fort; Thomas's games will say whether it's fun.
- **Replays stay exact:**
  - The popper's random jump is seeded by the shot.
  - A crush's slow motion no longer depends on whether the lava already took the plushie; in the race that had made replays drift.
  - The race replay stops at each fort's next shot even when the log interleaves both forts.

### Open questions for the next sessions
- **Cheat castles:** does walling plushies in up to the waist become the dominant strategy?
- **Tiebreaks:** do they now decide too many matches? If so, a fourth volley or more shots per volley, rather than weaker forts.
- **Building:** does the random box make it less repetitive? Which kinds never get used (`/games`, "What goes into forts")?
