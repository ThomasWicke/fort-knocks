# Phase 2: Core design

Status: approved on 2026-10-20. **Gate decision:** all three match structures go into the prototype as modes (section 3a).

Neutral names until Phase 3 picks a world: *fortress*, *block*, *target*, *launcher*, *projectile*, *volley*.

## 1. Foundations (true for every variant)

### Two ranges, one per fortress
A phone in landscape can't show two fortresses facing each other across a gap at a size you can read. So we use Angry Birds' layout: **the launcher on the left, the fortress on the right, and the camera pans between them.** Each fortress sits on its own range, and the opponent's launcher stands at a fixed distance in front of it.

Both phones mirror this, so each player always shoots left to right. You build from the attacker's point of view: a ghost launcher on the left shows you the angles your opponent will have. Nobody has to defend a launcher. Phase 3's world has to explain the layout.

### Three targets per fortress
- **Why three:** three can be counted at a glance, every target matters, and a score like "2–1" reads instantly.
- **When a target is out:** when it **touches the ground**, takes a **crushing hit**, or **leaves the arena**.
- **Why the ground rule:** it's the most readable rule there is (it fell, so it's out), and it makes height matter. Height is the whole idea of the game.

### Build a blueprint, then the settle
On a phone, live physics while you place blocks is frustrating: the stack wobbles while your thumb is still on it. So you build on a **snap grid with physics off**. When building ends, physics switches on and **the settle** happens: whatever falls, falls. A target that falls during *your own* settle is out. That's comedy, and it's the incentive to build something that stands.

A **Test** button runs the settle privately, as often as you like. It's the Poly Bridge "will it hold?" moment, minus the embarrassment.

### The shared draw
Every match starts with one random draw that **both players get identically**: the budget and block set, the ammo schedule for the whole match, and the arena variant. It's the duplicate-bridge principle from the brief: variety from match to match, never luck for one side.

### Simultaneous phases on a shared clock
Both players build at the same time and shoot at the same time. If you finish early, the camera turns to **your own fortress** and you watch the incoming shots live. That's never dead time. In the paper playtest below, it was the tensest moment of the volley.

### Your targets are your avatar
The opponent is never visible, but their targets are. On your screen, **the opponent's targets act as the opponent**:
- they laugh when you miss and cheer when they survive
- they perform the opponent's quick reactions: about five, such as laugh, wow, taunt, nooo, gg

There's no chat. In remote play this is the opponent's presence. In the same room it's a bonus. It comes straight from Angry Birds, whose pigs laugh at you.

### Scoring
1. **Most targets still standing** wins the match.
2. **Tie:** higher destruction wins. That's the value of the opponent's blocks you broke or knocked to the ground, as a percentage of their fortress.
3. **Still tied:** sudden death. One shot each, and the most destruction wins.

A 0–0 can't decide a match, because every fortress is reachable (section 2) and the destruction percentage settles any tie.

## 2. The builder problem
A human builder wants you to fail. Below is every degenerate fortress we could think of, and the rule that takes the edge off each. This is dominant-strategy analysis: find the move that makes every other move pointless before the players do.

| Degenerate fortress | Why it's tempting | Countermeasure |
|---|---|---|
| **The bunker:** targets inside a closed box | Unreachable | **Open-sky funnel:** a 45° funnel opens upward from each target's *feet*, and no block may be placed inside it. The game draws the funnel while you build, so the rule explains itself. |
| **The ground-hugger:** targets on the ground behind a wall | Nothing to topple | **Minimum height:** targets must stand at least N cells up. That, plus the ground rule, means height is risk. |
| **The roof:** an overhang or a roof on stilts | Blocks lobs | The funnel reaches to the top of the build zone. |
| **The cup:** a target sunk between walls | Side hits can't push it out | The funnel starts at the *feet*, not the head, so nothing may stand beside a target at its level. Every target stands on an open ledge. The crush rule covers the rest. (Found in paper playtest 1.) |
| **Stone spam:** a wall of the strongest material | It's the strongest | **Budget:** materials have prices, stone is expensive, and the draw may cap counts per material. |
| **Out of reach:** targets in the far top corner | Beyond range | The whole build zone lies within the launcher's reach at full power. |
| **Stilts:** each target alone on a thin pillar, spread out | Each needs its own precise hit | **Allowed:** it's a legitimate precision fortress. But its collapses are tiny, which is bad for pillar 1. Watch it in the prototype (H3). |

### Who supplies the level's weak point?
In Angry Birds, the level designer hides a TNT crate for you to find. A human opponent never will.

A first draft tried to bribe them with a **volatile block**: cheap and strong, but it explodes when hit hard. **It's dropped**, for three reasons:
- **Narrow balance window:** too good and every fortress is a minefield, too weak and nobody touches it.
- **Its value depends on skill:** a good shooter always finds it, so it's always bad against good players and always good against bad ones.
- **Loss aversion:** people weigh a possible loss more heavily than an equal gain. Builders won't plant a bomb in their own fortress even when the numbers say they should.

A rule that only works if players act against their instincts is a broken rule.

**The game doesn't need a planted weak point,** because weak points appear on their own:
- **Budget:** you can't afford strength everywhere. Every fortress has a cheap part, and the attacker can see it.
- **Physics:** every tall structure has load-bearing blocks. Finding the one whose loss brings down the rest is exactly the reading Angry Birds asks for.
- **Material vs. projectile:** each material is weak to some projectile (Phase 4), and the ammo schedule is known in advance. The builder decides which weaknesses to expose, and the attacker exploits what's exposed.
- **Height:** the rules put targets up on ledges, so everything under them is a weak point.
- **Optional, later:** the arena can supply a weak point that neither player chose. For example, a loose boulder on a ledge above the build zone, identical in both ranges. We'd add this only if the prototype shows fortresses looking too alike.

Explosions stay in the game on the attacker's side, as a bomb projectile like Angry Birds' black bird.

## 3. Three match structures (the gate)

### A. Three fresh rounds
Each round: draw → build → settle and reveal → siege → highlight. The rounds escalate (small, medium, large budget; 2, 3, 4 shots), and the match is best of three.

- **Length:** ~7 min for 3 rounds, ~4 min for a 2–0.
- **Feels like:** three short Angry Birds levels designed by your friend, each bigger than the last.
- **For:** easiest to learn. Every round resets, so comebacks are easy. Lots of building, and a new draw every round.
- **Against:**
  - About half the match is building on a phone, which is the fiddliest part.
  - Each fortress is small and disposable, so there's less pride and less pain when it falls.
  - The biggest round doesn't happen in a 2–0.
  - A fortress never gets a second act.

### B. One fortress, three volleys (recommended)
Draw → build (90 s) → settle and reveal → volley 1 → highlight → repair → volley 2 → highlight → repair → volley 3 → finale.

- **Length:** ~5 min. One-sided matches end earlier.
- **Feels like:** a siege. Your fortress takes damage, you patch it, they adapt, and the last volley decides it.
- **For:**
  - **Pride:** one big build per match means pride in it (pillar 2) and a bigger fall (pillar 1).
  - **Arc:** a natural climb to a climax.
  - **Free levels:** the ruins after each volley are **a new level nobody designed**. Chaos does the level design, which gives freshness for free.
  - **Mind games:** the repair creates a guessing game (section 6).
  - **No snowball:** losing blocks doesn't weaken your attack. There's no positive feedback loop of strength, as there is when an RTS army shrinks, so the leader can't run away with it.
- **Against:**
  - Repairing ruins is the hardest UX on a phone.
  - Physics state carries over between phases, which is tech work.
  - Only 6 shots per match.
  - A blowout ends fast, though arguably that's a feature.

### C. The race
Draw → build → settle and reveal → both bombard at the same time with a reload timer and no shot limit. The first to knock out all 3 targets wins. After 2 minutes, most targets standing wins.

- **Length:** ~4 min.
- **Feels like:** a frantic shoot-out across the room. Loud.
- **For:** the most same-room energy, nobody ever waits, and "defence is measured in seconds": every fortress falls, the only question is how fast.
- **Against:**
  - Rushing fights pillar 3: aim turns into spam.
  - The next shot interrupts the last collapse, so there's no time to enjoy the fall (pillar 1).
  - Little room to read the opponent.
  - The projectile roster matters less.
  - It's hard to follow what's happening to your own fortress.
- **Better use:** a later party mode.

### Against the pillars
| | A: Three rounds | B: Three volleys | C: Race |
|---|---|---|---|
| 1. The fall is the payoff | ●● | ●●● | ● |
| 2. Build to show off, not to hide | ●● | ●●● | ●● |
| 3. Aim is skill, the fall is chaos | ●●● | ●●● | ● |
| 4. One more match | ●● | ●●● | ●●● |
| Match length | 4–7 min | ~5 min | ~4 min |
| Biggest UX risk | building 3× on a phone | repairing ruins | following your own fortress |
| Tech cost | lowest | medium | medium |

**Recommendation: B.** It's the only variant that serves all four pillars, and it gives the match an arc. Its two risks, repair UX and state handover, are exactly what the grey-box prototype is for.

## 3a. Gate decision: build all three as modes
**Thomas's call:** build A, B and C. Keep the modes that are fun in different ways. Drop any mode that another one clearly beats.

This is affordable because most of the game is shared: building, the settle, the launcher, projectiles, targets and scoring. A mode is just a configuration of one match engine:

| | A: Three rounds | B: Three volleys | C: Race |
|---|---|---|---|
| Builds per match | 3, each bigger | 1 | 1 |
| Shots | 2 / 3 / 4 per round | 2 per volley, 3 volleys | unlimited, with a reload |
| Repair | no | yes (reserve + allowance) | no |
| Fortress carries over | no | between volleys | one continuous siege |
| Draw | per round | per match | per match |
| Win | best of three rounds | most targets after 3 volleys | first to clear all 3, otherwise most after 2 min |
| Tiebreak | destruction, then sudden death | same | same |

What follows from it:
- **Lobby:** whoever creates the room picks the mode. A rematch keeps it, and the finale offers a switch.
- **Phase 3:** the world frames the modes as different events of one competition.
- **Phase 4:** one shared roster and one set of materials, with the numbers (budget, clocks, shots) set per mode.
- **Phase 6:** build the shared core first. Then A (the simplest), then B (adds carry-over and repair), then C (adds reload).
- **Criteria for cutting a mode,** fixed now before anyone plays, so we don't favour the mode we built most lovingly:
  - **Free choice:** after a session, which mode do players pick when nobody suggests one? A mode nobody picks goes.
  - **Too similar:** if two modes feel the same, they merge into the better one.
  - **A reason to exist:** a mode survives only if it's the best answer to some situation, for example C for a five-minute break and B for an evening.
- **Phase 7:** "small and complete" (brief) still applies. The favourite mode gets full polish first, and the others follow when it's done.

## 4. Variant B in detail

### Timeline and interest curve
Schell's interest curve: a good experience has a hook, peaks that climb with valleys between them, and a climax near the end.

| Time | Beat | What both players do | Intensity |
|---|---|---|---|
| 0:00 | Draw | See the budget, block set and the ammo for all 3 volleys | ● |
| 0:05 | Build, 90 s (ends early when both are ready) | Build in blueprint, test the settle any time. See the opponent's block count and ready flag | ●● rising |
| 1:35 | Settle | Physics on for both fortresses at once. What falls, falls | ●●● hook |
| 1:40 | Reveal | The camera sweeps across the opponent's fortress | ●●● |
| 1:45 | Volley 1, up to 40 s | Fire 2 shots. When done, watch your own fortress take hits | ●● → ●●● |
| 2:25 | Highlight, ~6 s | The best moment on *your* fortress (you only saw it small), plus the target counts | ●●● |
| 2:31 | Repair, 20 s | Reinforce or patch from your reserve. Swipe to study their ruins | ● valley |
| 2:51 | Volley 2 + highlight | | ●●● |
| 3:37 | Repair, 20 s | | ●● tense valley |
| 3:57 | Volley 3, the final | 3-2-1 countdown on both phones at once | ●●●● |
| 4:37 | Finale, ~20 s | Full replay of your fortress falling, tally, tonight's score, rematch | ●●●● → ● |

Escalation option to test: volley 3 gets 3 shots instead of 2.

### What each player sees, and when
| Phase | Main view | Also |
|---|---|---|
| Build | Your fortress from the attacker's side (ghost launcher on the left) | The draw, the opponent's block count and ready flag |
| Settle and reveal | Your fortress settles, then theirs is revealed | |
| Volley | Your launcher and their fortress | A small live view of your fortress; when you're done, the camera switches to it |
| Highlight | The best moment on your fortress | Target counts on both sides |
| Repair | Your ruins | Swipe to their ruins to plan the next volley |
| Finale | Your fortress's fall, in full | Tally and tonight's score |

### A real decision in every phase
Sid Meier: a game is a series of interesting decisions. A phase without one is waiting.
- **Build:**
  - shape and materials
  - where the targets stand
  - which weaknesses to expose to the known ammo
  - **how much budget to hold back for repairs**
- **Volley:** which part of the fortress to attack, which projectile now and which to save, the aim, and the timing of the ability.
- **Repair:** where they'll strike next, while they guess where you've reinforced.

Watching your own fortress has no decision, but it's spectacle, not dead time.

### Repair
- **Reinforce:** tap a standing block to upgrade its material, for example from weak to strong. One tap, no precision needed. This is the phone-friendly verb. *(Replaced in Phase 4 by **tape**, which joins two touching pieces with one tap, because upgrading a material has no logic in a world of toys.)*
- **Patch:** place new blocks into free space. They drop and settle.
- **Cost:** paid from the **reserve** (budget not spent while building) plus a small allowance for each repair.
- **Targets:** targets that are out stay out. Surviving targets can't be moved.
- **Hidden:** repairs stay hidden until the next volley starts, which makes a small reveal.

### Early end
If all 3 of a player's targets are out at the end of a volley, the match ends there. The volley always finishes, so both players get their shots.

## 5. Loops at four time scales
- **Shot (~10–15 s):** read the fortress → choose a projectile → pull back → release → tap the ability → watch → learn from the trail.
- **Volley and repair (~1 min):** 2 shots → watch your defence → highlight → repair, which is a guess.
- **Match (~5 min):** draw → build → settle and reveal → 3 volleys → finale → rematch.
- **Evening (30–60 min):** tonight's tally, and the slow game of learning each other's habits. In a duel between the same two people, this metagame is the biggest source of freshness (Koster: fun is learning, and here you learn a person).

## 6. Chance and information

### Chance
Costikyan argues that uncertainty is what keeps a game alive, and that the question is what kind. Game designers distinguish input randomness (random before you decide, which creates decisions) from output randomness (random after you decide, which can feel like being robbed).
- **The draw is input randomness:** shown before anyone decides and identical for both. Pure variety.
- **Physics is deterministic but chaotic:** a tiny difference in aim can make a huge difference in the outcome. We keep it where it's fun, in *how things fall*, and out of where it hurts:
  - the score counts 3 clear events, not piles of debris
  - a launch is exactly repeatable
  - the last shot's trail stays visible
- **No hidden dice:** no random wind, no critical hits, no random break thresholds.
- **Test:** with the bot harness as in Wingnut Circus, a precise bot must beat a sloppy bot most of the time. If it doesn't, chaos is deciding too much (H6).

### Information and reading the opponent
| Open | Hidden |
|---|---|
| The draw (all blocks, all ammo, for both) | Each build until the reveal, for suspense rather than security |
| Both fortresses after the reveal | Repairs until the next volley |
| The ruins between volleys | Where the other will aim |

Sirlin's *yomi* (reading the opponent) needs a simultaneous hidden choice, and **the repair is ours**. You reinforce where you think they'll hit next. They aim where they think you didn't reinforce. The known ammo schedule sharpens it: "volley 2 brings their bomb, so they'll go for the middle tower".

## 7. Paper playtests
A paper playtest means playing matches through in prose, trying to break each rule (Fullerton). Two were run.

### Playtest 1: the friend tries to hide
1. The friend puts all 3 targets on the ground behind a stone wall. **The game refuses: minimum height.**
2. They raise them 3 cells up in a stone box. **The funnels turn red: no roof allowed.**
3. In the first draft of this doc, the funnel started at the target's *head*. That made a **cup** possible: a low stone platform with each target sunk between walls exactly as tall as itself. Side hits can't push it out, and only a heavy lob can crush it.
   - **Finding:** the cup is a quiet dominant strategy, and the fortress is short, wide and dull to watch fall, which hurts pillar 1.
   - **Fix (now in section 2):** the funnel starts at the target's **feet**. Nothing may stand beside a target at its level, so every target is on an open ledge.
4. With the fix, the friend's cheapest safe build is a stone pedestal with the target on top. That's expensive, and it's exactly what a side hit knocks off. Hiding loses its edge.

### Playtest 2: a full match in variant B
**Build:**
- **Thomas** builds tall: a stone base, a wood middle, a glass top, with targets on two levels and 20% of the budget held back.
- **The friend** builds three stilts, one target on each, with almost no reserve.

**Volley 1:** Thomas's heavy shot topples one stilt (a target out, but a small collapse). The friend's splitter shatters Thomas's glass top, and a target falls five cells. **1–1.** In the highlight, the room laughs at the glass.

**Repair:** Thomas reinforces the middle of the tower (wood to stone). The friend has nothing worth repairing: stilts can't usefully be reinforced.

**Volley 2:**
- The ammo schedule gives the friend the bomb, and Thomas guessed right: it hits the reinforced middle, and the middle holds. **Thomas wins the guessing game.**
- Thomas finishes both shots in 15 s and then watches the friend's second shot fly at Thomas's own fortress. **It's the tensest 20 seconds of the volley.**
- Thomas misses a stilt twice. Stilts demand precision.

**Volley 3:** Thomas topples a second stilt. The friend's last shot brings down most of Thomas's tower, and a second target goes. **1–1 on targets.** On destruction, the friend has broken more of Thomas's (bigger) fortress than Thomas has of their three cheap stilts, so **the friend wins.**

**Findings:**
- **F1:** the arc works: 1–1, a guessing win, then everything decided in volley 3.
- **F2:** watching your own fortress after finishing early isn't waiting. Keep it.
- **F3:** stilts are a legitimate counter-style, but they make small collapses. If stilts turn out to be the *best* build, pillar 1 loses. Possible levers:
  - the splitter as a natural counter
  - targets having to share one structure
  - destruction measured in absolute block value rather than percentage
  This becomes H3.
- **F4:** the highlight must show what you saw least, which is the hits on *your* fortress. Otherwise it repeats what you just watched live.
- **F5:** the tiebreak may reward cheap fortresses. Whether destruction is a percentage or absolute value is a Phase 4 decision (H7).

## 8. Edge cases
- **Disconnect:** the room (a Durable Object) holds the match, and the phase clock pauses for up to 60 s. The player rejoins through the same link and lands where they left. After that, the other player can end the match (no result recorded) or keep waiting.
- **Idle during the build:** at the end of the clock, whatever is placed settles. Unplaced targets go onto a default plinth automatically, so the match stays playable.
- **Idle during a volley:** shots not fired by the end of the volley clock are lost.
- **Long collapses:** a volley ends when both players have fired and everything is at rest, at most ~8 s after the last shot.
- **Rematch:** both tap, a new draw follows, and tonight's tally updates. Either player can leave.

## 9. Hypotheses only play can answer (Phase 6 test list)
- **H1:** building a fortress on a phone in 90 s feels creative, not fiddly.
- **H2:** repairs (reinforce and patch) are doable on a phone in 20 s, and they create guessing games.
- **H3:** no fortress style dominates. At least three stay viable (tall, wide, stilts, …), and the best one doesn't make small collapses.
- **H4:** 2 shots per volley feels like enough control. Or volley 3 needs 3.
- **H5:** watching your own fortress after finishing early is exciting, not frustrating.
- **H6:** a precise bot beats a sloppy bot in most matches, so chaos isn't deciding.
- **H7:** fewer than ~15% of matches go to a tiebreak, and the tiebreak doesn't favour cheap fortresses.
- **H8:** a match takes 4–6 min, and players want a rematch.
- **H9:** 60 fps during the biggest collapse on a mid-range phone.

## 10. Handed on
**To Phase 3. The world has to explain:**
- why two equal sides build fortresses and lob things at each other: a feud, a sport, a festival?
- the two-range layout
- targets as characters who belong to a side and act as their owner (laugh, cheer, taunt)
- 3–4 materials, each one weak to some projectile
- what "the ground" is (earth, water, lava…) that puts a target out
- repair as something that happens in the world
- the three modes as events of one competition

**To Phase 4, the numbers:**
- budget and prices
- material properties
- minimum target height, funnel angle, crush threshold
- build zone size and reach
- volley clock and shots per volley
- repair allowance
- the ammo roster and the rules for the schedule
- whether the tiebreak uses percentage or absolute value
