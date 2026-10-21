# Phase 6: Grey-box prototype, "find the fun"

Status (2026-10-21): **M3 (ammo) and a first art pass are playable** at https://fort-knocks.thomaswi1998.workers.dev. Every match is saved and can be replayed (`/games`). **Plan change (Thomas):** build M3 to M6 as an MVP at Claude's judgement, then playtest it with a friend and decide from the data.

**Goal:** answer the question no document can, which is whether this is fun. As cheaply as possible, before any production art or networking.

## 1. Tech spike: which physics engine
**Setup:** the fort from the style frame (`dev/physics-spike/spike.mjs`) in all three maintained 2D engines.
- Run in Node on Thomas's M2 Mac mini.
- Scale: 1 cell = 1 m, gravity −10.
- A stress scene with 99 bodies: three forts, a 14-block tower, a 12-domino row and four marbles.

| | Planck.js 1.5.1 | Rapier 0.21.0 | Box2D v3 (box2d3-wasm 5.2.0) |
|---|---|---|---|
| What it is | Box2D 2.x ported to JavaScript | Rust compiled to WebAssembly | Box2D v3 compiled to WebAssembly |
| Fort stands after the settle | yes | yes | yes |
| Still moving 1–5 s after the settle (cells) | 0.017, a slow creep | 0 | 0 |
| Rebuilt from saved positions, drift over 5 s | 0.014 | 0.002 | 0.001 |
| Exact whole-world snapshot | no | yes (31 KB, zero drift) | no |
| Same shot twice gives the same result (same machine) | yes | yes | yes |
| Stress scene, ms per step (avg / p95) | 0.38 / 0.55 | 0.11 / 0.13 | **0.06 / 0.08** |
| Download (gzip) | 55 KB | 1.3 MB (compat build) | 250 KB |

Notes:
- **All three are fast enough.** A phone frame has 16.7 ms, and even Planck uses about 3% of it on a phone that's 5× slower than the Mac.
- **Only the stacking quality and the download size really separate them.**
- **Moving forts between phones works in every engine.** A fort rebuilt from saved positions stays standing (drift ≤ 0.014 cells). Each fort is simulated on the attacker's phone, and its positions are streamed to the defender (Phase 7), so cross-device determinism isn't needed.
- **Destruction differed per engine** (5 / 7 / 9 pieces moved by the same shot). That's solver character, not a defect. The prototype is where we judge which collapse looks best.

**Decision: Box2D v3.**
- **Stacking:** its solver was designed for stable stacks, which is the core of a fort game. The spike confirms zero drift.
- **Speed and size:** it's the fastest of the three, and a sixth of Rapier's download.
- **Lineage:** it's the current version of the engine Angry Birds was built on, by the same author (Erin Catto).

**Risk:** the WebAssembly wrapper is a community project (Birch-san's box2d3-wasm, last release Feb 2026).

**Fallback:** Rapier, which is company-maintained, has world snapshots and a deterministic build. The spike's adapter layer makes switching cheap. The game code talks to a small physics interface, never to the engine directly.

**Findings that change the design:**
- **The card tent is one rigid piece** (two cards joined at the top). Two loose leaning cards slid apart in every engine. It's still the lightest, most fragile piece.
- **The settle works as intended:** the style frame's own fort had a domino resting on a triangle's point, and all three engines dropped it. The rule "what falls, falls" catches bad building without any extra rule.

## 2. Stack
- **Vite + TypeScript, no framework.** Canvas 2D for drawing, reusing the style frame's drawing code (pieces, crayon) in plain grey-box colours.
- **Physics:** Box2D v3 (compat build: no threads or SIMD needed, works in every browser) behind a small interface.
- **Typed code:** TypeScript as in Fabricator, because most of this code is written by Claude, and types catch mistakes before play does.
- **Testing on Thomas's phone:** https://fort-knocks.thomaswi1998.workers.dev (`npm run deploy`), or the Vite dev server on the local network.

## 3. Milestones
**Reordered on 2026-10-20 (Thomas):** M1 proved the feel of the shot, but whether the game is fun can only be judged on a whole match. So M2 became **one complete match, end to end**, before abilities, modes or polish.

**M2 as built:**
- The Siege with three volleys of two marbles, the lava rising one cell per volley, and an early end when a fort has no plushies left.
- The build screen: the shared draw and the budget, drag to place, tap to turn, drag back to the box to return, the rules drawn live, and Test.
- The result screen with tonight's tally and Rematch.
- Pass and play on one phone, or against a bot. The bot builds one of three legal forts and aims at a random plushie with human-sized errors.
- **Not yet:** ammo abilities (marbles only), repair and tape, a build timer (the clock counts up so we learn how long building takes, for H1), crayon art and sound.

**Rule changes from building it:**
- **The open-sky funnel is 30° from vertical,** not 45°. With 45°, two tall towers couldn't stand side by side, which worked against pillar 2.
- **The build height is capped at 7 cells,** not 12. A landscape phone's height is the limit, and the tallest bot fort reaches 6.

The original plan, kept for reference:
Each milestone ends in something Thomas can play on his phone.

| | What | Answers |
|---|---|---|
| **M1 Sandbox** | A fixed fort on a rug, the launcher (drag back, release), marble physics, camera follow, plushies out on the lava, a reset button | Does shooting feel good (Swink)? Is the collapse satisfying (pillar 1)? |
| **M2 Build** | Toy box tray, snap-grid placement with physics off, rotate, budget, minimum height and funnel shown live, Test, the settle. Pass-and-play on one phone: both build, then each shoots the other's fort | H1: building on a phone in 90 s. H3 begins |
| **M3 Rules** | The four ammo types with their tap abilities, the ammo schedule, scoring, the crush rule, rising lava | H4, H10, H13, H14 |
| **M4 Modes** | Best of Three, The Siege (repair, tape), Before Mum Comes In (reload, Mum's footsteps), as configurations of one match engine | H2, H11, the mode-cutting criteria (`02-core-design.md` §3a) |
| **M5 Bots** | A builder bot and a shooter bot with skill levels, plus a balance harness like Wingnut Circus's `tools/bot.js` | H3, H6, H7, H12 (dominant forts, skill vs. chance, tiebreaks) |
| **M6 Two screens** | Two browser tabs or two phones, each building and shooting at the same time (a thin relay, ahead of Phase 7's real rooms) | H5 (watching your own fort while waiting), H8 (match length, rematch wish) |

**Grey-box rules:**
- Flat material colours.
- Plushies are simple shapes with a face.
- No sound beyond basic clicks.
- Polish waits until the fun is proven. It's tempting to fall for a pretty prototype of a boring game.

## 4. Playtest protocol
- **Who:** Thomas, plus someone who isn't the friend (the game is a surprise). Bots cover balance.
- **Each session:** what was played, observations against the hypotheses, and quotes. One page per session, in `docs/06-playtest.md`.
- **Gate:** "is it fun?" If not, go back to Phase 2 or 4 before any production.

## 5. Art pass, noted for Phase 7
**Thomas's feedback on the style frame:** the room looks prototype-ish.
- **Plan:** the room becomes an **illustrated backdrop** in the key-art style (`icon-7-fall-blue.jpg` as reference), with variants for rainy afternoon and lights out.
- **Why it can be an image:** it never moves, so it doesn't need to be code.
- **What stays in code:** everything that moves or breaks, plus the crayon layer.

## 6. M3 as built: four ammo types (2026-10-21)
- **The ammo schedule:** three volleys of two, every type at least once, never the same type twice in a volley. It's the same for both players, and the build screen shows it ("Incoming"), so a builder can read it (H14). In each turn the shooter picks the order: tap a sticker at the bottom left.
- **The four types**, all leaving the launcher at the same speed, so the aim preview means the same thing for each:

| Ammo | Body | Tap in flight |
|---|---|---|
| Marble | r 0.3, density 4 | none: the pure skill shot |
| Jacks | a bundle, r 0.3, density 3 | fans out into four jacks (three crossed arms each), ±14° apart |
| Spinning top | r 0.33, density 4 | stops dead and drops at 6 m/s. It stays a normal body: light pieces give way, a heavy stack stops it |
| Water balloon | r 0.42, density 1.2 | bursts (it also bursts on its first touch). A push wave of radius 2.6 cells, and everything it reaches is soaked: friction 0.12, so books slide |

- **The crush rule:** a plushie hit directly with a momentum of at least 12 (mass × approach speed) is out, with a puff of stuffing. That's a marble at about two thirds of full power. Measured with Box2D's hit events.
- **Crayon effects:** impact stars, stuffing puffs, splashes, smoke when a knocked-off piece vanishes, and dust while the top drills. A pulsing "tap!" ring marks ammo that can still be tapped.
- **Replays include taps:** a shot logs the step its ability fired at, and the replay taps at the same step.

**Tuning with `client/src/sim.ts`** (`__fk.sweep(fort, ammo)`): each ammo type was fired at each of the three bot forts over 15 angles × 5 powers, with a good player's taps. Shots taking out at least one plushie (of 225):

| | First try | Final |
|---|---|---|
| Marble | 90 | 79 |
| Jacks | 87 | 87 |
| Spinning top | 121 (the drill flattened towers, and crushed whatever it landed on) | 78 |
| Water balloon | 71 | 82 |

Each type is now the best on a different fort. The jacks take out two or more plushies most often (36 of 225), which is their job: they spread.

## 7. The first art pass (80/20)
Thomas loved the concept art and asked for "a touch of it" while he playtests. These changes take the most from the least:
- **The room is one illustration** (`docs/concept/game-art/backdrop-*.png`, made with the Codex pipeline and both of Thomas's favourite concepts as references). It shows the wall with the kid's crayon volcano and dragon, a rainy window, the masking-tape border between the siblings, and the floor flooded with lava. The playfield stays empty, and the image is placed in world coordinates, so the lava line matches the physics. Three versions exist: `?room=a|b|c` switches between them (remembered per device); c is the default.
- **The rug is an island** in the lava: an illustrated sprite in team colours (blue stripes or green stripes).
- **The plushies are the illustrated sprites** from the style frame, with the bandana recoloured per team. Out plushies turn grey.
- **The type from `docs/style.md`:** Lilita One for titles, Baloo 2 for the interface, Gochi Hand for what the kid writes.
- **Still code-drawn, as the style guide intends:** pieces, ammo, launcher and crayon effects. The assets are made by `dev/art/make_art.py` (keying and team colours), and the prompts are next to it.

## 8. Online rooms (M6, built as the real thing)
M6 was planned as a thin relay ahead of Phase 7's rooms. The friend MVP needs the real thing, so it was built once, properly.
- **Joining:** "Play a friend online" opens a room with a four-letter code and a link (`/r/ABCD`) to share. The friend opens the link, or taps "Join a friend" and types the code. When both are in, the match starts.
- **Building:** both build at the same time, from the same draw and the same ammo schedule.
- **Who simulates what:**
  - Each phone simulates the fort it attacks, so Box2D on the attacker's phone decides what happens to that fort.
  - It streams snapshots of that fort to the owner: 15 a second while anything moves, once a second when it's quiet.
  - The owner watches their own fort as a picture (`Puppet`), smoothed between snapshots.
  - So cross-device determinism is never needed: a phone only ever simulates one fort, and reports that fort's plushie count.
- **Volleys:** both players shoot at the same time. When a phone's two shots are done and its target is quiet, it reports and switches to "Your fort", to watch the other player's shots land (H5). The room waits for both phones, then raises the lava (each phone on its target), waits for both again, then starts the next volley or ends the match.
- **The room** (`party/room.ts`, a Durable Object through partyserver, in the same Worker):
  - It seats the two phones. A phone's id is kept on the device, so a reconnect gets its seat back.
  - It relays forts, shots and snapshots, and keeps the score.
  - It writes the game log to D1 itself (mode `online`), so a closed tab never loses a game.
  - Its state is saved on every change.
- **Reloads mid-match:** the phone gets its seat back, rebuilds its target from the last snapshot, and continues its volley with the ammo it hasn't fired yet. Shots fired before the reload stay in the log.
- **Rematch** starts a new match in the same room, with a new draw and a new game number.
- **Tested** with two browser tabs against the local Worker: lobby, both building, simultaneous volleys with abilities, lava, the result, a rematch, and a reload mid-volley. The online game log replays exactly. Not yet tested: two real phones on mobile networks.
