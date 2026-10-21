# Fort Knocks: plan

A live 1v1 physics-siege game for the browser. It plays close to classic Angry Birds, but each player builds a fortress and shoots down the other's. Made for Thomas and friends. The bar: impress the friend who asked for "Angry Birds 1v1" after playing Wingnut Circus.

## Settled (2026-10-20)
- **Audience:** Thomas and friends. No monetisation, no market analysis.
- **Ambition:** high. Wingnut Circus is the quality bar to beat.
- **Play:** live online, two players join a room by link. Rooms run on Cloudflare Durable Objects through `partyserver`, the successor to PartyKit. Fabricator's README explains why PartyKit itself is out: its shared zone no longer accepts new projects.
- **Match structure, direction:** simultaneous rounds. Both players build at once, then both shoot at once, so nobody waits.
- **Mechanics:** stay close to classic Angry Birds: slingshot, physics structures, materials, a roster of projectiles with abilities, and targets to knock out.
- **World:** unique. No birds, no pigs. Not a reskin of Wingnut Circus's Flying Circus, and not generic medieval.
- **Concept first:** no game code until the design and identity phases are done. The first code is a grey-box prototype in Phase 6.

## How we work
- One phase at a time. Each phase ends in a document in `docs/` and a gate where Thomas decides. Nothing moves on without that decision.
- Theory is used where it decides something, and named where it is used, with a short "why" and its source. It is not a lecture up front.
- Mechanics keep neutral names until the world is chosen, then get themed names. Examples: heavy shot, splitter, weak/medium/strong material.
- Decisions go in the decision log at the bottom of this file.

## Phase 1: Brief and pillars → `docs/01-brief.md`
Questions it answers:
- Who plays: on which device (phone or laptop, landscape?), in what setting (on a voice call? in the same room?), and for how long per sitting.
- The fantasy in one sentence, plus 3–4 pillars that break ties in every later decision.
- What the game is not: the scope fence.
- What "it worked" looks like, for example the friend asks for a rematch without being prompted.

Work: take the reference games apart element by element.
- **Angry Birds:** the pull-back, the pause before release, the slow-motion collapse, the bird roster as verbs, levels as puzzles, the stars.
- **Crush the Castle:** its ancestor.
- **Worms:** artillery among friends, the comedy of failure.
- **Clash of Clans:** watching the replay of your base being attacked.
- **Super Mario Maker:** players as level designers, and the troll levels that follow.
- **Poly Bridge / Besiege:** you build, then physics judges you.
- **Wingnut Circus:** what the friend liked, what to carry over, what to make different.

Theory: MDA (Hunicke, LeBlanc, Zubek), LeBlanc's eight kinds of fun, Lazzaro's four keys to fun (people fun, fiero, schadenfreude), Fullerton's formal elements.

**Gate:** Thomas approves the pillars.

## Phase 2: Core design → `docs/02-core-design.md`
Questions it answers:
- **Loops at three time scales:** a shot (~10 s), a round (~2–3 min), a match (~8–10 min).
- **Round flow and timing:** build → siege → reveal, where you watch the replay of your fortress falling. Also, what each player sees of the other during each step.
- **Win condition and scoring:** including how a 0–0 stalemate is made impossible.
- **Persistence:** does a fortress carry over between rounds (repair what's left), or does each round start fresh?
- **The builder problem:** list every degenerate build we can think of, and the rule that defuses each. For example: the bunker, the hidden target, a wall of the cheapest strong block, a build meant to collapse on purpose.
- **Chance:** physics chaos makes stories, but the score should reward intent.
- **Information order:** who knows what, and when (materials, ammo, target positions). This is where reading the opponent (yomi) happens.
- **Edge cases:** disconnect, AFK, rematch.

Method: paper playtests. Concrete match storyboards, played out in prose, that attack each rule.

Theory: Schell's lenses and interest curves, dominant-strategy analysis, Sirlin on yomi, Costikyan on uncertainty, Koster on learning.

Also produces: a list of hypotheses that only real play can answer. They become the Phase 6 test list.

**Gate:** Thomas picks one of 2–3 match-structure variants.

## Phase 3: World directions → `docs/03-world-directions.md` + a visual board
1. **Identity brief:**
   - Personality in 3–5 words, plus must and must-not.
   - Production constraints: the art must read on a phone and break convincingly into pieces.
   - It must be producible by us. Wingnut Circus draws all its art in canvas code.
2. **Landscape audit:** how comparable games look (Angry Birds, Bad Piggies, Clash, Worms, Cut the Rope, Alto's Adventure, …). Map them on two axes to find open space.
3. **Four world directions,** each with:
   - **Premise and rivalry** between two equal sides. In PvP there is no villain.
   - **Mapping table:** fortress, 3–4 materials, launcher, projectiles, targets, arena.
   - **Flavour mechanic:** one mechanic the world suggests.
   - **Tone and references:** games, films, illustrators.
   - **Palette sketch.**
   - **3 concept images:** a fortress mid-collapse (key art), a character lineup, and a mock in-game screen. The mock screen replaced the material study: it shows the materials too, and it tests whether the style reads at phone size and could be drawn in code.
4. **Scoring:** rate each direction against the brief: readability, how ownable it is, how well it breaks, character appeal, producibility, name potential.

Tools: concept art comes from ChatGPT's image generation, which is faster and better than the local models and has plenty of weekly quota. Claude writes a prompt pack: one shared style preamble per direction, so a direction's images look like one world, plus a numbered prompt per image. Thomas runs the prompts in the ChatGPT app and saves the results as `docs/concept/<direction>/<nn>.png`. Claude then builds the board from those files. Concept art is for choosing a direction, not final art.

Optional: show the board to the friend for a vote, or keep it a surprise.

**Gate:** Thomas picks a direction, or a hybrid.

## Phase 4: Systems → `docs/04-systems.md`
- **Materials:** 3–4, each with density, strength, friction, cost, damage states, and how it breaks.
- **Projectiles:** a starting roster of ~4, plus ideas that only make sense in PvP. Each one is a verb with an ability trigger.
- **Targets:** how many, how tough, placement rules.
- **Launcher:** drag-back input, and how much of the trajectory is previewed. The preview is a main skill and balance knob.
- **Build rules:** budget, build zone, a stability test before the siege, an exposure rule for targets.
- **Numbers:** a counter matrix (material × projectile), the scoring formula, and starting values with reasons.

Theory: orthogonal unit differentiation, intransitive (rock-paper-scissors) balance, cost curves, game feel (Swink).

**Gate:** Thomas signs off the systems.

## Phase 5: Identity production → `docs/style.md` (rules) + `docs/05-identity.md` (reasoning)
- **Characters (projectiles, targets):** silhouette sheets, expressions, voice.
- **Material kit:** damage states and break effects. Arena and colour script.
- **Style rules,** structured like Wingnut Circus's style guide:
  - pillars and palette tokens
  - shape and outline rules, light, type
  - UI materials
  - motion: squash and stretch, slow motion, camera, screen shake
  - sound direction
- **Name, logo, icon:** the name checked against existing games, the icon tested at small sizes.
- **UI kit:** room link / lobby, build HUD, siege HUD, reveal, result.
- **Style frame:** one real screen drawn in code. It proves the style survives our production pipeline, not only the concept art.

**Gate:** Thomas signs off the style guide and the style frame.

## Phase 6: Grey-box prototype, "find the fun"
- **Tech spike:** pick a physics engine for stable stacking, phone performance and replays. Candidates: Box2D v3 (WASM), Planck.js, Rapier.
- **Prototype:** one device, no art, no network. Build against a timer, then shoot the fortress. Then two browser tabs. Build the shared core first, then modes A, B and C as configurations of one match engine.
- **Mode comparison:** apply the cutting criteria fixed in `02-core-design.md` §3a.
- **Testing:** run the Phase 2 hypotheses and write `docs/06-playtest.md`. Change the design wherever play disagrees with paper.

**Gate:** is it fun? If not, go back to Phase 2 or 4 before any production.

## Phase 7: Production (planned in detail after Phase 6)
Networked rooms (partyserver Durable Objects, join by link), simultaneous rounds, the opponent's view (sync approach decided in the Phase 6 spike), replays, art pass, sound, polish, deploy on Cloudflare.

## Decision log
- 2026-10-20: friends only, high ambition. Live online via Cloudflare Durable Objects (partyserver). Direction: simultaneous rounds. Repo opened as `topple`, a working title; it gets renamed when the game has a name.
- 2026-10-20: concept art is made in ChatGPT from Claude's prompt packs.
- 2026-10-20: phones first, landscape, laptops supported. Played mainly in the same room, but remote must be fun too. The game is a surprise for the friend, so all calls are made by Thomas and Claude. Phase 1 brief drafted in `docs/01-brief.md`.
- 2026-10-20: **Phase 1 approved**, including the pillars and the scope fence. Peeking at the other phone is not a concern. Phase 2 drafted in `docs/02-core-design.md`.
- 2026-10-20: the volatile block (cheap and strong, explodes when hit) is dropped. Thomas's objections: it's hard to balance, and Thomas would never use it. Weak points come from budget, physics and material-vs-projectile matchups. Explosions stay as an attacker's projectile.
- 2026-10-20: **Phase 2 approved.** All three match structures (A three rounds, B three volleys, C race) are built as modes of one match engine. Criteria for cutting modes are in `02-core-design.md` §3a. Phase 3 started.
- 2026-10-20: concept art now comes through the Codex CLI (Thomas's ChatGPT login, isolated read-only runs), so Claude generates and iterates on images itself. The ChatGPT app with pasted prompts stays as the fallback.
- 2026-10-20: Phase 3 concept art is done: 12 images plus 2 second takes. Board: https://claude.ai/artifact/MjDTr4JR9gUfbVoqq1XfrZ. Scores: Floor Is Lava 19, Topple Games 17, Low Tide 15, Garden Feud 14. Recommended: Floor Is Lava with rising lava.
- 2026-10-20: three more worlds added at Thomas's request (Cubicle Wars 20, Battle of the Bands 20, Bauhaus Brawl 21; Floor Is Lava 22 on the extended 24-point scale).
- 2026-10-20: **Phase 3 decided: The Floor Is Lava.** The extra image round moves into Phase 5, after Phase 4 has fixed the roster. Phase 4 drafted in `docs/04-systems.md`.
- 2026-10-20: **Phase 4 approved** (four ammo types, toppling instead of breaking, tape as repair, rising lava as a test). Phase 5 started: art direction, name shortlist and 8 exploration sheets in `docs/05-identity.md`. Board: https://claude.ai/artifact/1zbTQT5i5TQD4gTxBDuUF3.
- 2026-10-20: **Name: Fort Knocks. Second team colour: green.** Repo renamed `topple` → `fort-knocks`. Step 5.2 done: `docs/style.md` (palette with a colour-blindness check, type, drawing rules for both layers, UI kit, motion, sound, words, logo and icon). Logo: alphabet blocks. Icon: Socke. Next: 5.3, the style frame in code.
- 2026-10-20: identity, rounds 2–4: alphabet blocks dropped (they read as a word game). **Key-art style: drawn, but detailed**, with `icon-7-fall-blue.jpg` as the reference image. **App icon decided:** Hoppel falling into lava on team blue. Logo finalists: letters as a fort, or sewn letters.
- 2026-10-20: **Logo decided: sewn letters, drawn** (`logo-12-sewn-drawn.jpg`). Step 5.2 closed. Step 5.3 started: a style frame testing the hybrid (illustrated plushie sprites on code-drawn pieces).
- 2026-10-20: **Step 5.3 done: the style frame** (`dev/style-frame/`, https://claude.ai/artifact/9P73VpxqB29uGvxaLZGPAX). The hybrid works: illustrated plushie sprites on code-drawn pieces. Cell size raised to 30 pt. Waiting for the Phase 5 gate.
- 2026-10-20: **Phase 5 approved. Phase 6 started.** Repo pushed to GitHub (`ThomasWicke/fort-knocks`). The physics spike compared Planck, Rapier and Box2D v3 on the real fort. **Engine: Box2D v3 (box2d3-wasm)**, with Rapier as the fallback. The card tent becomes one rigid piece. Stack: Vite + TypeScript, canvas 2D. Milestones M1–M6 in `docs/06-prototype.md`. Art-pass note: the room becomes an illustrated backdrop (Thomas: the room looks prototype-ish).
- 2026-10-20: **M1 (sandbox) playable and deployed** to https://fort-knocks.thomaswi1998.workers.dev, as a Cloudflare Worker with static assets. Thomas asked for Pages; wrangler now folds new Pages projects into Workers, and the Phase 7 rooms will live in the same Worker. Box2D is bundled from its compat build directly (the threaded build can't be bundled).
- 2026-10-20: **Plan change (Thomas):** fun can only be judged on a whole match, so M2 is one complete match end to end: build, settle, three volleys, rising lava, result, rematch. Pass and play or against a bot. Built and deployed. Rule tuning: the open-sky funnel is 30° from vertical (45° blocked tall neighbouring towers), and the build height is capped at 7 cells for phone screens.
- 2026-10-20: **Playtest 1** (Thomas, M2 vs bot): building was hard to figure out and too costly, the marble too strong, the wait between shots too long, and the bottom-edge drags triggered swipe-home. Changes: minimum plushie height 2, lava rises only between volleys, builder now allows anything and explains rule breaks in red, drop-to-box, the blueprint settles, fixed tray slots, marble density 4 and top speed 16 m/s (measured), next shot 1.6 s after the hit, tray lifted, tap-to-take, how-to card, home-screen icon. Notes in `docs/06-playtest.md`.
- 2026-10-20: **Playtest 2** (Thomas): more balanced, building better, but it needs a friend test. The preview felt inaccurate: measured, the arc is exact, and the cause is the short pull (about 50 px on a phone) plus lift-off wobble. So a shot now fires the pull from 50 ms before release, and full power takes 110 px. **Every match is saved** (Thomas) in Cloudflare D1 under a game number, with a Past games page (`/games`), per-piece usage across forts, and exact replays. The physics now advances only in counted steps, so a shot is fully described by its step and pull.
- 2026-10-21: **Plan change (Thomas):** feedback on a grey box is hard without experience, so Claude builds M3–M6 as an MVP at its own judgement, then Thomas playtests it a lot with a friend and the game log supplies the data. Claude's adjustments: real online rooms instead of M6's throwaway relay, and the balance harness before full bots. Plus a first art pass, 80/20: illustrated room, rug island, plushie sprites, real fonts.
- 2026-10-21: **M3 done:** four ammo types with tap abilities, the ammo schedule (shown while building), the crush rule (momentum 12). Tuned with the new `sim.ts` sweeps so each type takes out a plushie in 78–87 of 225 test shots. **Art pass 1 done:** room C (rain, tape border, crayon volcano and dragon) as the default, with a and b behind `?room=`.
- 2026-10-21: **Online rooms done** (M6, built as the real rooms rather than a relay): a room code and link, both phones building and shooting at the same time, each phone simulating the fort it attacks and streaming it to its owner, the room keeping the game log. Pass and play and the bot stay.
