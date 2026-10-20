# Phase 6: Grey-box prototype, "find the fun"

Status: tech spike done, engine chosen; **M1 (sandbox) playable** (2026-10-20). Next: Thomas plays M1 on his phone, then M2.

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
