# Phase 4: Systems (The Floor Is Lava)

Status: approved by Thomas on 2026-10-20, all four ★ decisions included.

**Gate:** Thomas signs off the systems, especially the four decisions marked ★ below:
- ★1 the four ammo types
- ★2 toppling instead of breaking
- ★3 tape as the repair verb
- ★4 rising lava as a prototype test

All numbers are starting values for the Phase 6 prototype, not final.

## Names in this world
| Neutral name (Phases 1–2) | In this world | UI word (final call in Phase 5) |
|---|---|---|
| fortress | fort | Fort |
| block | piece: card tent, domino, toy block, book | Pieces |
| target | plushie | Plushies |
| launcher | rubber band stretched between two pencils stuck in a book | — |
| projectile | ammo: marble, jacks, spinning top, water balloon | Ammo |
| ground | the floor, which is lava | Lava |
| build zone | the rug | — |
| repair | raid the toy box, tape things together | Repair |

Wingnut Circus's habit carries over: labels and rules use plain game words, and the fiction lives in the pictures.

## 1. The two lava rules
1. **A plushie that touches the floor is out.** The rug counts as floor too.
2. **Pieces are allowed to touch the floor.** They're furniture, and lava only hurts plushies.

That's the real kids' game (furniture is safe, you aren't), and it's our Phase 2 rule that a target touching the ground is out, with nothing added.

**Pieces knocked off the rug are lost.** They count towards destruction, and once they come to rest they fade away in a puff of crayon smoke. That keeps the scene tidy and saves physics work on the phone.

## 2. ★2 Toppling, not breaking
In Angry Birds, wood splinters and glass shatters. **Toys don't break, they topple, slide and flutter.** This game is Jenga, not demolition, which suits the name *Topple*:
- **Destruction** means **pieces knocked off the rug**. It's measured as a share of the fort's value.
- **No damage points:** pieces have no health. Every result can be seen, nothing is hidden in numbers, which serves pillar 3 ("aim is skill, the fall is chaos").
- **The one exception is plushies:** a hard enough direct hit knocks them out (a puff of stuffing). That's Phase 2's crush rule.

## 3. Pieces
Four materials. Every one is a real object, so players know how it behaves before any tutorial. Designers call this an **affordance** (Don Norman): an object communicates its own use. Everyone knows a book is heavy and a card is flimsy.

| Piece | Shapes, in cells (1 cell = one toy block) | Weight | Grip | How it behaves | Cost | Weak to |
|---|---|---|---|---|---|---|
| **Card tent** | Two leaning cards joined at the top as **one rigid piece** (Phase 6 spike), 1.5 × 1.4; a flat card as a roof, 2 × 0.15 | very light | low | Gives way at a touch and flutters down | 1 | Jacks |
| **Domino** | Standing 0.5 × 2, lying 2 × 0.5 | light | medium | **Falls in chains** | 1 | Marble |
| **Toy block** | Cube 1 × 1, long 2 × 1, arch 2 × 1, triangle 1 × 1 | medium | high | Stacks well, tumbles and clacks | 2 (long and arch 3) | Spinning top |
| **Book** | Lying 3 × 0.5, standing 0.5 × 3 | heavy | high | Holds, until it gets wet and slides | 3 | Water balloon |

Why the prices are what they are (a cost curve, Schreiber): a price should match what a piece is worth.
- **Card tents** give cheap height but fall at once.
- **Dominoes** are cheap and useful, but they carry their own risk: **a chain of them carries one hit right across the fort.** That's the "planted weak point" from Phase 2 coming back on its own, chosen freely by the builder, without a bribe.
- **Blocks** are the honest middle.
- **Books** are expensive because they're the strongest, and they still have one enemy.

## 4. Plushies
- **Three per fort.** Each is 1 × 1 cell, half the weight of a toy block, with high grip: a neighbour's bump doesn't move them, but a direct hit does.
- **Out** when they touch the floor or rug, take a crushing hit, or leave the arena.
- **Placement:**
  - on top of a piece, at least **3 cells above the rug**
  - with the open-sky funnel above them (45°, starting at the feet), drawn as a crayon V
  - the minimum height shown as a crayon tape mark on the wall
- **Choice is pure expression:** each player picks three plushies from the toy box (bunny, bear, dinosaur, octopus, robot, …). They all have the same physics, so the choice can't be wrong. Team colour is the bandana: **blue or yellow**.
- **They act as their owner on the other player's screen** (Phase 2): they laugh at misses, cheer, and perform quick reactions.

## 5. ★1 Ammo
**Version 1 has four**, each a different verb. Designers call this *orthogonal unit differentiation* (Harvey Smith): units differ in what they do, not in how strongly they do the same thing. Each has a single tap ability, except the marble.

| Ammo | Verb | In flight | Tap during flight | Best against |
|---|---|---|---|---|
| **Glass marble** | Punch | small, dense, fast | nothing, it's the pure skill shot | Dominoes (starts chains), plushies hit directly |
| **Jacks** | Split | a bundle | scatters into 4 jacks fanning out | Card tents, forts spread out wide (stilts, H3) |
| **Spinning top** | Drill | heavy, slower | stops dead and drills straight down, shoving pieces aside | Toy-block towers, plushies you can only reach from above |
| **Water balloon** | Splash | big, soft, wobbly | bursts early (otherwise it bursts on impact): a push wave plus a soaking | Books (wet books lose grip and slide), card tents (go limp) |

**Later, not in version 1:** bouncy ball (Bounce: tap for a super bounce), yo-yo (Return: tap to snap back and hit from behind), toy car (Dash: tap for a horizontal boost). Four complete ammo types beat seven rough ones ("small and complete", brief).

### Who beats what
| | Card tent | Domino | Toy block | Book |
|---|---|---|---|---|
| Marble | ●● | **●●●** | ●● | ● |
| Jacks | **●●●** | ●● | ● | ● |
| Spinning top | ●● | ● | **●●●** | ●● |
| Water balloon | ●● | ●● | ● | **●●●** |

Every ammo type has exactly one best material, and every material exactly one enemy. Like rock-paper-scissors, nothing is best against everything (intransitive balance).

Because the ammo schedule is known at the start of the match, this turns into reading the opponent (*yomi*, Sirlin):
1. **The builder reads the schedule.** "Volley 2 brings their water balloon, so I won't build on books."
2. **The attacker reads the fort.** "Their middle is all toy blocks, so the spinning top goes there."
3. **The attacker picks the order** of their two shots within each volley.

## 6. The launcher
- **Aim:** drag anywhere on the left half of the screen. The band stretches from the pencils, and you release to fire. Drag back to the middle to cancel. You never have to hit a small target with your thumb.
- **Power:** grows with the pull distance up to a maximum. The angle ranges from −15° to 80°. Full power at 45° reaches the back edge of the rug, so the whole build zone is reachable (Phase 2).
- **Preview:** crayon dots show the first **35%** of the arc. The previous shot's full path stays visible as faint crayon dots. The preview length is a skill knob; the prototype tests 25%, 35% and 50%.
- **Feel**, using Swink's game-feel parts (input, response, context, polish):
  - the band creaks louder as it stretches
  - the camera eases out slightly at full pull
  - a vibration tick at maximum on phones that support it
  - on release: a snap, a whoosh, and the camera follows the ammo
  - on impact: crayon scribbles over the hit

## 7. Building
- **The rug is the build zone:** 10 cells wide, with a height cap of 12.
- **The toy box tray** shows every piece with its count and price. Drag a piece out to place it, tap it to rotate 90°, drag it off to put it back (refunded). Pieces snap to a half-cell grid.
- **Physics stays off while building.** The **Test** button runs a private settle, as often as you like. When building ends, **the settle** happens: 3 seconds of physics for both forts at once.
- **Rules show while you place:** the funnel turns red when it's blocked, and the minimum-height mark is always on the wall.

## 8. ★4 Rising lava (to test in the prototype)
**Proposal:** Low Tide's best idea, moved into this world.
- **The lava line climbs the fort:** by 1 cell after every volley in the Siege, and every 30 s in Before Mum Comes In.
- **Only plushies are affected:** a plushie whose feet are below the line is out. **Pieces are unaffected,** as with rule 2 in section 1.
- **It never moves during shots,** only during the highlight beat, with a crayon animation everyone can see.

Why:
- **Pillar 2:** it's direct pressure towards "build to show off, not to hide".
- **The interest curve:** every volley gets more dangerous.
- **Pillar 3:** it's visible and the same for both players.
- **Cost:** in this world it's just a crayon band, very cheap to draw.

Risk: a plushie lost to the lava rather than to a shot may feel unearned. In practice it mostly finishes off plushies that a shot has already knocked down onto a low ledge. That's a reward for partial hits, but it needs testing (H10).

## 9. ★3 Repair (Siege mode only)
- **Patch:** take pieces from the toy box (paid from the reserve) and place them in free space. They drop and settle.
- **Tape:** tap the seam between two touching pieces to tape them together. **Cost 1, at most 3 per repair.** Tape holds until a hard hit tears it, roughly the force of a toy block falling two cells.
  - **Phone-friendly:** one tap, no precision needed.
  - **Replaces Phase 2's "reinforce"** (upgrading a material), which has no logic in a world of toys.
- **Why tape only in repairs:** a fully taped fort is one rigid lump. It would topple as a whole and never collapse, which means no spectacle (pillar 1).
- **Unchanged from Phase 2:** knocked-out plushies stay out, surviving plushies can't be moved, and repairs stay hidden until the next volley.

## 10. Scoring
1. **Most plushies standing** wins.
2. **Tie:** the larger **share of the opponent's fort value knocked off the rug** wins. It's a percentage of what was built, so a cheap fort gains no advantage (Phase 2, F5).
3. **Still tied:** sudden death. One marble each, and the most value knocked off wins.

## 11. The three modes in this world
The fiction is a rainy afternoon, with three games the siblings play:

| | A: Best of Three | B: The Siege | C: Before Mum Comes In |
|---|---|---|---|
| Build time | 45 / 60 / 75 s | 90 s | 75 s |
| Budget | 12 / 18 / 24 | 30 (unspent money is the reserve) | 24 |
| Shots | 2 / 3 / 4 per round | 2 per volley, 3 volleys | unlimited, 5 s reload |
| Ammo | drawn per round | schedule per match, 2 per volley | the match schedule on a loop |
| Repair | – | 20 s: patch and tape, reserve + 3 | – |
| Rising lava | off (rounds are short) | +1 cell per volley | +1 cell every 30 s |
| Clock | siege 40 s | volley 40 s | 2 min. **Mum's footsteps** at 0:30, and when she opens the door the match is over |

**The draw** (identical for both players):
- **Pieces:** a count per type, for example cards 6–10, dominoes 6–10, blocks 8–12, books 3–6. The total value comes to at least 1.5× the budget, so you have to choose and can't use everything.
- **The Siege's ammo schedule:** 6 slots, every type at least once, never the same type twice in one volley.
- **Later:** room variants such as daylight, lights out with a torch, or the attic with a sloping ceiling.

## 12. Paper playtest 3: this world against the rules
- **The staircase:** ledges under each plushie catch it when it gets knocked off, so it never reaches the floor. This is the strongest defence found so far.
  - **Counters:** the crush rule, the spinning top (drills down through the stairs), the jacks (scatter outwards), and the rising lava, which finishes off plushies stuck on low ledges.
  - It needs watching (H12).
- **The book wall:** heavy and expensive. At most 10 books on a budget of 30, a wall in front stops direct shots, but lobs reach the plushies anyway (funnel), and the water balloon is its enemy. Fine.
- **The card tower:** cheap, tall and fragile, so spectacular. Pillars 1 and 2 both like it, and the jacks are its enemy. Fine.
- **Domino chains:** a weak point the builder takes on voluntarily, because dominoes are cheap. This is how Phase 2 wanted weak points to appear.

## 13. Starting numbers
| What | Value | Why |
|---|---|---|
| Plushie minimum height | ~~3~~ **2 cells** (playtest 1) | 3 used up most of the budget; the rising lava already punishes low plushies |
| Funnel | ~~45°~~ **30° from vertical**, from the feet (prototype) | 45° kept two tall towers from standing side by side |
| Crushing hit | ~~a marble at about 60% power~~ momentum 14: a marble at about three quarters of full power, hitting directly (tuned in Phase 6) | Direct hits should count, but bumps shouldn't |
| Tape tears at | about a toy block falling 2 cells | Survives wobbling, not a real hit |
| Preview | 35% of the arc | Somewhere between Angry Birds (none) and a full guide |
| Weights (relative) | card 0.2 · domino 0.6 · block 1 · plushie ~~0.5~~ 2 (bean-filled, Phase 6 sims) · book 3 | Matches what people expect from real objects |

## 14. New hypotheses for Phase 6
- **H10:** rising lava feels like pressure, not unfairness.
- **H11:** tape is one tap and still matters.
- **H12:** the staircase doesn't dominate.
- **H13:** four ammo types keep five matches in a row fresh.
- **H14:** players actually read the ammo schedule, so what gets built changes with the schedule.

## 15. Handed to Phase 5 (identity production)
**What needs drawing:**
- 4 piece families in every shape
- 5–6 plushies with expressions
- 4 ammo types plus their ability effects
- the launcher
- the crayon lava, including the rising line
- the rug, the room, tape
- the funnel and height mark
- the HUD and the toy box tray

**What needs a sound:** card flutter, block clack, domino chain, book thud, marble clink, balloon splash, band creak, crayon scribble, Mum's footsteps.

**Names:** the final UI words, mode names, plushie names, and the game's name.
