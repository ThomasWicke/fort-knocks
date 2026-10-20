# Phase 5: Identity production (The Floor Is Lava)

Status: steps 1 and 2 done; step 5.3 (the style frame) built on 2026-10-20 and waiting for the Phase 5 gate.

| Step | What | Thomas decides |
|---|---|---|
| **5.1 Direction and exploration** | Art-direction statement, identity pillars, name shortlist, first exploration sheets | The name; reactions to the sheets |
| **5.2 Lock it in** | Logo and wordmark, app icon (tested small), palette tokens, type, UI kit, sound direction → `docs/style.md` | Sign-off on the style guide |
| **5.3 Style frame** | One real game screen drawn in code: launcher, fort with all four piece types, three plushies, crayon lava, HUD | **Gate:** style guide and style frame |

## 1. Art direction
**In one sentence:** a cosy, quiet bedroom where a child's imagination scribbles a blockbuster on top.

The tone risk from Phase 3 was that it reads as a game for children. The answer isn't to make it less childlike. It's to show childhood the way grown-ups remember it. The room is real, calm and lovingly drawn. The imagination is an action movie in crayon, like Calvin's Spaceman Spiff fantasies in *Calvin and Hobbes*. Adults laugh at the gap between the two layers. The plushies take everything far too seriously.

## 2. Identity pillars
These break ties for every drawing, sound and word, alongside the design pillars from the brief.

1. **Two layers, never mixed.**
   - **Real things are clean vector:** flat colour, one soft shade, thin outlines.
   - **Imagined things are crayon:** wobbly strokes, scribbled fills, no outlines.
   - A crayon flame never gets a vector outline, and a toy block never gets scribbled on.
   - Game information may live in the crayon layer (lava, the funnel V, aiming dots, impact scribbles), because in the fiction the kid draws the rules.
2. **The kid imagines a blockbuster.** Crayon effects are oversized and dramatic: an explosion twice the size of the hit, lava that roars. This is where the grown-up joke lives.
3. **Toys you have held.** Every piece looks, moves and sounds like the real object. Players read them from memory, not from colour codes.
4. **Plushies are drama queens.** All the emotion lives in button eyes, stitched mouths and big poses. Everything else stays still.

## 3. Production rules from day one
All in-game art is drawn in code, as in Wingnut Circus, so the style has to be built from things code draws well:
- **The real layer:**
  - rounded rectangles, circles and simple paths
  - a flat fill with one shade band and a thin outline
  - no textures except the card backs and book spines, which are simple patterns
- **The crayon layer:** a single crayon-stroke function (jittered polylines plus hatched fills) used for everything imagined. It becomes the heart of the art code.
- **No text inside art.** Words live in the UI layer.
- **Readability check:** every screen gets tested at 390 pt height (a landscape phone).

## 4. Name
**What a name has to do:**
- be short and fun to say
- hint at the game
- not be taken by a known game
- work as a crayon wordmark
- work for a German group of friends

Checked by web search on 2026-10-20:

| Name | The idea | Is it taken? |
|---|---|---|
| **Fort Knocks** | A pun on Fort Knox: you build forts, they get knocked | No game found. Only an EVE Online item called "Fall of Fort Knocks" |
| **Plushfall** | Like nightfall or snowfall: plushies falling | No game found |
| **Ka-Plush!** | The sound a plushie makes landing in the lava | No game found |
| **Rainy Day Rumble** | The fiction and the fight in three words | No game found. A game-jam entry called *Rainy Day Duel* exists |
| **Floorless** | "A floorless victory", a pun on flawless | A tiny itch.io speedrun game uses it |

**Dropped:**
- **Topple:** an iPhone game from 2008, plus a sequel.
- **Floor Is Lava:** a Netflix show and several games.
- **Fluff & Fury:** a teddy-bear tabletop RPG called *Fluff n' Fury*.
- **Toybox Siege:** a crowded field of toy-soldier games.

**Recommendation: Fort Knocks.**
- **The pun lands for adults.**
- **It names both halves of the game:** you build the fort, they knock it.
- **It suits a scribbled crayon logo.**

**Runner-up: Plushfall.** It's prettier and has more mood, but less of a joke.

## 5. Exploration, round 1
Eight sheets in `docs/concept/lava-explore/`:
- cast
- expressions
- pieces
- ammo
- launcher
- room moods
- build screen
- result screen

The findings are in section 6.

## 6. What round 1 showed
Board: https://claude.ai/artifact/1zbTQT5i5TQD4gTxBDuUF3

**The direction holds.** In every sheet the room is calm and the crayon on top is an action movie. The launcher hero shot sums up the whole idea: a real book and pencils, and behind them a crayon volcano and a castle under fire.

**Keep:**
- **Six plushies nobody could mix up.** Bunny, bear, dinosaur, octopus, robot and a one-eyed sock monster. **The sock monster is the breakout character and the mascot candidate** for the logo and icon.
- **Expressions:** all eight bunny states are the plushies' vocabulary on the opponent's screen. Sinking into lava is the best frame: clean toy, crayon fire, both layers exactly as the rules say.
- **Pieces:** the four families tell apart at a glance. Wet book, limp card, masking tape and crayon smoke read without explanation.
- **Ammo:** each ability reads as a three-frame comic. **Fire and water are the two crayon "elements"**: orange-red for lava and impacts, blue for splashes.
- **The UI language: stuff from a kid's desk.**
  - cardboard for the toy-box tray
  - masking tape for the height mark
  - crayon stickers for buttons
  - tally marks for small counts
  - a paper sheet taped to the wall for tonight's score (the head-to-head tally from the brief, as a real object in the room)
- **Lights out:** the most striking room mood. Crayon lava glows by itself, so a night room is nearly free to draw. It's a candidate arena variant.

**Fix in the style rules (5.2):**
- **No fur texture.** A flat fill, stitch lines and one patch per toy. Hatching isn't drawable in code, and the generator keeps adding it.
- **Strict side view everywhere.** The pieces and room sheets drifted into 3/4 and perspective views.
- **Wall drawings stay quiet during play.** Crayon backdrops (volcano, dragon) sit at low contrast behind the fort and only wake up during big moments. Otherwise they compete with the pieces.
- **The second team colour.** Yellow bandanas drown in the lava's colours (result sheet). Proposal: **green**, which red-green colour-blind players still tell apart from blue, plus a pattern on both bandanas so colour is never the only signal.

## 7. Thomas's calls after step 5.1
1. **Name: Fort Knocks.**
2. **Second team colour: green,** with patterns on both bandanas.

## 8. Step 5.2: what got locked in
The rules are in `docs/style.md`, and the visual companion is the board, https://claude.ai/artifact/1zbTQT5i5TQD4gTxBDuUF3.
- **Repo:** renamed from `topple` to `fort-knocks`.
- **Team green became `#0F7B5F`.** A colour-blindness simulation (Machado et al. 2009, worst case across protanopia, deuteranopia and tritanopia) showed the first candidate, `#2E9E5B`, was invisible against the floor for people without red vision (ΔE 0.2). The deeper teal-green separates from the floor (24), the lava (42) and team blue (17), and white icons on it reach 5.2:1 contrast.
- **Team colours belong to teams only.** No piece is blue or green.
- **Type:** Lilita One for display, Baloo 2 for the UI, Gochi Hand for the kid's handwriting.
- **Logo, round 1: alphabet blocks.** FORT stands, KNOCKS tumbles away from a marble.
- **Icon, round 1: Socke** rising out of the lava.
- **Round 2, after Thomas's feedback** (Hoppel's fall was the more expressive icon, and the logo left out the lava):
  - **Icon: Hoppel's scream close-up** on team blue. Still readable at 29 px once cropped in and given a contrasting background.
  - **Favicon:** only Hoppel's ears out of the lava.
  - **Logo: blocks over lava, as one object with two states.** At rest the S tips into the lava; after the first tap on the title screen, the KNOCKS row slides in.
  - **Hoppel becomes the face of the game.** Waiting for Thomas's confirmation.
- **UI kit:** stuff from a kid's desk (stickers, cardboard, tape, paper, a matchbox).
- **Plushie names:** Socke (the mascot), Hoppel, Brumm, Rex, Otto, Blech. These are proposals Thomas can change.
- **Sound follows the two layers.** The real layer gets foley. The crayon layer gets mouth sounds, recorded by Thomas.

## 9. Round 3 and the fidelity question
**Thomas's feedback on round 2:**
- **Alphabet blocks** make it look like a word game. That's a semantic mismatch: the letters promise spelling. So no letters on pieces, anywhere.
- **The icon:** the first Hoppel was better because the plush was detailed and realistic.

**Round 3** generated icons with the original Hoppel attached as a reference (Codex `-i`), which kept the character on model:
- **Icon pick:** a close crop of the detailed Hoppel sinking.
- **Favicon pick:** the detailed "gone under".
- **Logo pick:** sewn felt letters with Hoppel clinging and lava below.

**The open decision: in-game fidelity.** The style guide so far assumes everything is drawn in code, and code can't draw realistic fabric. Three options:
1. **Everything in code (as written).** Plushies in play are simpler than in the key art. Studios do this all the time: key art is more detailed than gameplay sprites. It's the cheapest option and the most consistent with the pieces.
2. **Hybrid (recommended).**
   - **Plushies are detailed raster sprites,** generated from a model sheet with the reference image, cut out on a flat key colour, one image per expression.
   - **Everything else is code:** pieces, room, crayon, UI.
   - **Why plushies:** they're the emotional core and few in number (6 characters × 8 expressions), and Fabricator already turns generated images into game sprites.
   - **Cost:** curating about 48 images for consistency, and soft-body squash done by transforming a picture rather than redrawing shapes.
3. **Everything raster.** Rejected. It's hundreds of images, and the physics pieces need exact shapes that code gives for free.

**The 5.3 style frame tests option 2:** one detailed plushie sprite standing on code-drawn pieces. If the two sit together well, it's settled.

## 10. Round 4: the key-art style is set
**Thomas's feedback on round 3:** the detailed sinking icon and the felt logos were too realistic. "The original, on blue" won.

**What this settled:**
- **The key-art style is "drawn, but detailed"** (see `style.md`), with `icon-7-fall-blue.jpg` as the reference image.
- **The app icon is decided.**
- **Favicon:** redrawn in the chosen style.
- **Logo:** two finalists in the chosen style. Letters as a fort (Claude's pick) or sewn letters.

**This also answers half of the fidelity question in §9.** Plushies in play should look like the icon: drawn and detailed, which code can't draw. That points to the hybrid: plushies as illustrated sprites, generated with the reference, while pieces, room, crayon and UI are code. Unless Thomas objects, the 5.3 style frame tests this.

## 11. Step 5.3: the style frame
**Page:** https://claude.ai/artifact/9P73VpxqB29uGvxaLZGPAX. **Source:** `dev/style-frame/`.
- **The screen:** The Siege, volley 2, at 844 × 390 pt, the size of a landscape phone screen.
- **Toggles:** aiming or impact, rainy afternoon or lights out, phone size or big.

**What it is made of:**
- **Drawn in code:**
  - the room, rug and launcher
  - all four piece families
  - the crayon layer: lava boiling at 12 fps, flames, wall drawings at 30%, aim dots for the first 35% of the arc, the last shot's trail, the impact burst, the rising-lava waterline
  - the HUD: sticker button, team bandanas with patterns, tape label, crayon clock, matchbox of ammo
- **Illustrated sprites:** Brumm, Hoppel and Socke in green-team bandanas.
  - **Made with:** Codex, with `icon-7-fall-blue.jpg` attached as the style reference, on a magenta background.
  - **Cut out:** offline with a small numpy/Pillow keyer (hue-based key plus despill). Sources are in `docs/concept/sprites/`.

**Findings while building it:**
- **The hybrid holds.** The sprites' bold ink outlines match the code-drawn pieces' outlines, so the plushies look like they belong on the fort.
- **Scale:** a 24 pt cell made the fort too small for a phone. The frame uses **30 pt cells**, plushies 54–64 pt tall, and the fort takes about 35% of the screen width.
- **Rising lava:** a hatched translucent sheet striped the pieces under it. It's drawn as a **crayon waterline with a faint wash and licks** instead.
- **Lights out:** needs a pool of torch light on the target fort, not just a beam, or the fort sinks into the dark. HUD text switches to cream.
- **The sticker button and bandana tokens read at phone size.** The matchbox is the smallest element and may need to grow in production.
