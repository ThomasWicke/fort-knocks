# Fort Knocks: style guide

Fort Knocks's world: two siblings share a bedroom split by masking tape. On rainy afternoons they build forts from the toy box, crown them with plushies, and fire marbles across the line. The floor is lava. This guide is the rule set every screen, piece, plushie, sound and word follows.

The reasoning behind it is in `docs/05-identity.md`. Boards: worlds https://claude.ai/artifact/MjDTr4JR9gUfbVoqq1XfrZ, exploration https://claude.ai/artifact/1zbTQT5i5TQD4gTxBDuUF3.

## Pillars (the tie-breakers)
1. **Two layers, never mixed.** Real things are clean vector. Imagined things are crayon. Game information may live in the crayon layer (lava, aim dots, the funnel, impacts), because the kid draws the rules.
2. **The kid imagines a blockbuster.** Crayon effects are oversized and dramatic. That's where the grown-up joke lives.
3. **Toys you have held.** Every piece looks, moves and sounds like the real object. Players read it from memory, not from colour codes.
4. **Plushies are drama queens.** All emotion lives in button eyes, stitched mouths and big poses. Everything else stays still.

## The two layers
| | Real layer | Crayon layer |
|---|---|---|
| What | The room, rug, pieces, plushies, launcher, ammo, UI objects (cardboard, tape, paper, stickers) | Lava, flames, splashes, smoke, impacts, speed lines, aim dots, the funnel V, tally marks, wall drawings |
| Drawn as | Flat fill, one shade band, one highlight, ink outline | Jittered strokes in 2–3 passes, hatched fills, **no outline** |
| Moves | With physics. Rigid, except plushies (soft) | "Boils": redrawn with a new wobble at 12 fps |
| Never | Scribbled on, textured, given fur | Outlined, given a gradient, given a shade band |

## Palette
CSS tokens in the game use the same names and values.

### Room
| Token | Hex | Use |
|---|---|---|
| `ink` | `#2E2A33` | Every outline in the real layer, body text on paper |
| `wall` | `#F4E9D8` | Wall, default background |
| `wall2` | `#E6D6BE` | Wall shade, skirting board |
| `floor` | `#C98B5A` | Floorboards |
| `floor2` | `#A86F45` | Board gaps, floor shade |
| `rug` | `#EFE6D2` | The rug (build zone) |
| `rug2` | `#8FA3B8` | Rug stripes |

### Pieces and toys
| Token | Hex | Use |
|---|---|---|
| `toyRed` | `#E63B2E` | Blocks, card backs, the balloon |
| `toyYellow` | `#F2B705` | Blocks, the spinning top |
| `wood` | `#D9A86C` | Natural blocks, pencils' wood |
| `wood2` | `#B5824A` | Wood shade, grain |
| `cream` | `#FBF3E2` | Dominoes, painted symbols, page edges |
| `bookOx` | `#8E2E2A` | Book spine |
| `bookMustard` | `#C9952B` | Book spine |
| `bookPlum` | `#6B3E62` | Book spine |
| `glass` | `#BFE3F2` | Marble body (with a toyRed and toyYellow swirl) |
| `metal` | `#B9C0C7` | Jacks |

**Team colours belong to teams only.** No piece is blue or green, so the colour of a thing always tells you whose it is.

### Teams
| Token | Hex | Pattern | Use |
|---|---|---|---|
| `blue` | `#2F6FDE` | White dots | Bandanas, badges, the blue player's UI |
| `blue2` | `#1F4FA8` | | Blue shade |
| `green` | `#0F7B5F` | White stripes | Bandanas, badges, the green player's UI |
| `green2` | `#0A5A45` | | Green shade |

**Checked on 2026-10-20** with the Machado et al. (2009) colour-blindness simulation, worst case across protanopia, deuteranopia and tritanopia:
- **Blue against green:** ΔE 17.
- **Green against the floor:** ΔE 24. The first candidate green, `#2E9E5B`, scored 0.2 here: invisible to protanopes.
- **Green against lava:** ΔE 42.
- **White icons:** contrast 4.7 on blue, 5.2 on green.

The patterns make sure colour is never the only signal.

### Crayon
| Token | Hex | Use |
|---|---|---|
| `lava` | `#FF5A1F` | Lava body, flames, impact bursts |
| `lavaRed` | `#E2341D` | Lava depth, flame cores |
| `lavaGlow` | `#FFD27A` | Lava highlights, sparks (kept paler than `toyYellow`) |
| `water` | `#3FA9F5` | Splashes, wet drips |
| `graphite` | `#4A4650` | Neutral scribbles, wall drawings, tally marks on paper |
| `crayonWhite` | `#FFFFFF` | Speed lines on dark ground |

**Fire and water are the two crayon elements.** Nothing else in the crayon layer gets a strong colour, except team-coloured tallies.

### UI materials
| Token | Hex | Use |
|---|---|---|
| `cardboard` | `#C8A06E` | Toy-box tray, panels |
| `cardboard2` | `#A8834F` | Corrugation lines, torn edges |
| `tape` | `#EADBB0` at 85% | Labels, the height mark, the tape repair |
| `paper` | `#FBF8F1` | Score sheet, notes |
| `paperLine` | `#B9D3EA` | Ruled lines |

### Night (lights out)
| Token | Hex | Use |
|---|---|---|
| `nightWall` | `#26304D` | Wall |
| `nightFloor` | `#4A3427` | Floor |
| `torch` | `#FFF1C9` at 35% | Torch cone |

Lava keeps its day colours and gains a soft glow. At night it's the brightest thing in the room.

## Drawing rules, real layer
- **Strict side view.** No perspective, no 3/4 views. Every piece is its front face.
- **Outline:** ink, round joins and caps, one weight on screen of about **2 px at the size it's shown**. Draw functions take the line width in their own units.
- **Light:** one soft key light from the upper left.
  - **Shade:** one flat band, about 15% darker, on the lower right.
  - **Highlight:** one small mark, white at about 40%.
  - **No gradients on objects.** Gradients belong to the torch cone and the lava glow.
- **Shape:** built from rounded rectangles, circles and simple paths, with corner radius about 12% of the short side. Toys are slightly worn but never wonky. They're real objects, not junk.
- **Material cues:**
  - **Wood:** 1–2 grain lines.
  - **Book:** spine band and a cream page edge with 3 lines.
  - **Domino:** cream body, ink pips, a centre line.
  - **Card:** a crossed-line back pattern.
  - **Glass:** a swirl and a highlight.
  - **Tape:** a pale strip with ragged ends, see-through.
- **No text inside art.** The logo is the only exception.
- **Readability:** plushie and ammo silhouettes must read at 24 px. Every screen is checked at 390 pt height.
- **Scale at phone size** (from the style frame): one cell is 30 pt, plushies stand 54–64 pt tall, and a 10-cell fort takes about 35% of the screen width.

## Drawing rules, crayon layer
- **One stroke function draws everything imagined:**
  - a polyline with a perpendicular jitter of about 1.5 px every 6 px
  - 2–3 passes at 70% opacity
  - stroke width 3–6 px
  - round caps
- **Fills are hatching:** strokes at 30–40°, 4–6 px apart, with a second pass at a slightly different angle for dense areas.
- **Boiling:** crayon redraws with a new jitter seed at 12 fps, like hand-drawn animation. Real objects never boil.
- **Twice the size:** an impact burst is about twice as big as the hit that caused it.
- **Wall drawings** (volcano, castle, dragon) sit at 30% strength during play and go to 100% at big moments: the settle, the reveal, the last plushie, the finale.

## Pieces
- **Card tents:** two leaning cards with a red or ink back pattern. A flat card serves as a roof.
- **Dominoes:** cream, ink pips (pip counts are decoration only), ink edge.
- **Toy blocks:** toyRed, toyYellow, wood or cream. One painted symbol each (circle, triangle, star), never a letter.
- **Books:** spines in ox, mustard or plum.

**States:**
- **Wet:** shade 10% darker, plus blue crayon drips.
- **Taped:** a tape strip across the seam.
- **Lost (knocked off the rug):** it comes to rest, then dissolves into a graphite crayon puff within 0.6 s.

## Plushies
| Name | Toy | Character |
|---|---|---|
| **Socke** | One-eyed red-and-white striped sock monster | Cheeky. Fan favourite |
| **Hoppel** | Bunny | Proud, and the loudest screamer. **The face of the game** (icon, logo rider) |
| **Brumm** | Bear | Grumpy |
| **Rex** | Dinosaur | Nervous |
| **Otto** | Octopus | Show-off |
| **Blech** | Fabric robot | Sleepy |

- **Construction:** drawn in the key-art style (reference: `concept/brand/icon-7-fall-blue.jpg`), with big expressive cartoon eyes (Socke keeps its single button eye), cross-stitch seams and one patch. Plushies in play are illustrated sprites, not code: see `05-identity.md` §9–10.
- **Team bandana:** in team colour and pattern.
- **Expressions:** idle, smug, laughing at a miss, cheering, taunting, falling, knocked out (crossed-stitch eyes and a puff of stuffing), sinking (crayon flames).
- **Squash and stretch are allowed for plushies only,** and generously.

## Ammo
- **Marble:** a glass circle with a red and yellow swirl and a highlight.
- **Jacks:** a six-armed metal star with ball ends. It splits into four.
- **Spinning top:** a wooden body with a toyRed and toyYellow band and a handle.
- **Water balloon:** a toyRed balloon with a knot, wobbling in flight.

Abilities and impacts are always crayon: speed lines, burst, spiral, splash.

## The room
- **Backdrop layers from back to front:**
  - the wall, with crayon wall drawings
  - framing furniture at the far left (bed edge, shelf)
  - the floor band
  - the rug
  - the lava, drawn in crayon over the floor beyond the rug
  - **the tape line** between the two players, seen at the far edge
- **Room variants:** rainy afternoon (the default; rain on the window and cool light) and lights out (night palette, torch cone, glowing lava). The attic comes later.

## Type
- **Display: Lilita One.** The logo, titles, mode names, big numbers. Use sparingly.
- **UI: Baloo 2** (500, 700, 800). Everything read in passing. Sentence case, tabular numbers where digits line up.
- **Handwriting: Gochi Hand.** Only what the kid writes: labels on tape, notes, captions on the score sheet.

All three are self-hosted via `@fontsource`, as in Wingnut Circus. None overlaps with Wingnut Circus's type (Bowlby One, Nunito, Caveat).

## UI materials: stuff from a kid's desk
- **Sticker button:**
  - a circle with a 3 px white peeled edge
  - a crayon-hatched fill (team colour, toyRed or graphite) and a white icon
  - a 2 px ink drop shadow
  - when pressed it moves down 2 px and the shadow disappears
- **Cardboard:** the toy-box tray and panels, with corrugation lines and one torn edge.
- **Tape label:** a strip of `tape` with ragged ends and Gochi Hand text. Used for small labels and the minimum-height mark.
- **Score sheet:** ruled paper taped to the wall at two corners. **Tally marks** in team colours for counts up to 10, with digits beside them in Baloo 2.
- **Counts in the toy-box tray:** tally marks up to 5, digits above that.
- **Plushie badges:** a round badge per plushie with its head and bandana. When the plushie is out, it gets crossed out in crayon.
- **The invite:** a folded paper note with a crayon door drawn on it. Sending the room link means passing a note.
- **Timer:** a crayon clock face whose wedge shrinks.

## Motion
- **Plushies:** squash and stretch, plus overshoot on landing. **Real pieces never squash.**
- **Crayon:** boils at 12 fps, and effects scribble in over 3–4 frames.
- **Slow motion:** 0.3× speed for about 1 s on the decisive moment (a plushie hits the lava, the biggest collapse of a volley).
- **Camera:**
  - follows the ammo and eases to the fort on impact
  - never rotates
  - a small zoom-out at full pull
- **Screen shake:** heavy hits only, at most 6 px, and none with `prefers-reduced-motion`.
- **UI** arrives like a sticker slapped on: scale 1.1 → 1.0 with a slight rotation.

## Sound
The two-layer rule applies to sound too.
- **Real layer = foley,** made procedurally in Web Audio where possible, as in Wingnut Circus:
  - block clack, book thud, card flutter
  - domino chain ticks, marble clink
  - balloon squeak, band creak and snap
- **Crayon layer = mouth sounds,** as a kid makes them: "pshhh", "kaboom", "nyeeeow", a gargled lava roar.
  - These are recorded as short samples.
  - **Thomas records them.** That's the most personal touch the game can have.
- **Ambience:** rain on the window during the rainy afternoon, and a clock ticking during lights out.
- **Music:** a toy piano for menus and building. At big moments a hummed "epic theme" swells in (a kid humming a blockbuster).
- **Story sounds:** Mum's footsteps on the stairs (Before Mum Comes In), the door handle at the end.

## Words
- **The game:** Fort Knocks.
- **The modes:** Best of Three, The Siege, Before Mum Comes In.
- **UI words:** Fort, Pieces, Plushies, Ammo, Lava, Volley, Repair, Tape, Rematch. Plain game words, with the fiction in the pictures.
- **Voice:** short, deadpan, cheeky. For example: "Hoppel is in the lava." "Mum's coming." "Rematch?" Sentence case, no exclamation marks except in the logo.

## Logo and icon
Explorations: `docs/concept/brand/`, shown on the identity board.

**Rule:** no letters on pieces or toys, ever. Alphabet blocks read as a word game.

### Key-art style: drawn, but detailed
Thomas chose this on 2026-10-20. **The reference image is `concept/brand/icon-7-fall-blue.jpg`.**
- **Line and colour:** a hand-drawn illustration with bold dark ink outlines, flat colours with soft cel shading, and one highlight.
- **Plush detail:** cross-stitch seams, a hint of fabric at the edges, big expressive eyes.
- **Never:** photo-real fabric, 3D felt, or cartoon simplification. All three were tried and rejected.
- **Consistency:** every new key-art image is generated with the reference attached (Codex `-i`), so Hoppel stays on model.

### App icon (decided)
`concept/brand/icon-7-fall-blue.jpg`: Hoppel falling into crayon lava on team blue. **Favicon (proposed):** `concept/brand/icon-10-gone-under-drawn.jpg`, with only the ears and a paw above the lava and the bandana floating.

### Logo (decided): sewn letters, drawn
`concept/brand/logo-12-sewn-drawn.jpg`:
- **The letters:** FORT KNOCKS as puffy stitched letters, cream FORT on a red patch with a button in the O, red KNOCKS with cream outlines.
- **Hoppel** clings to the top edge, screaming.
- **The fort:** a chair-and-blanket fort behind.
- **The lava:** crayon lava below, with the corner of the S smouldering.

**Title screen:** the logo as an image over the room, with Hoppel's ears and the lava animated, and the KNOCKS letters sliding into the lava on the first tap. That needs the letters cut out as separate pieces in the final art pass.

**At small sizes** the blanket fort turns into clutter, so use a simplified lockup: the letters and Hoppel without the fort.

**Small sizes and the kid's own version:** FORT KNOCKS in crayon on a taped paper sheet (`logo-11-kid.jpg`). For the score sheet and the loading screen.

### UI kit
`concept/brand/ui-kit.jpg` is the reference for every component listed under *UI materials*:
- sticker buttons with a peeled corner
- the cardboard tray
- tape labels
- the taped score sheet
- the folded-note invite
- the crayon clock
- plushie badges
- the matchbox of marbles as the ammo slot
