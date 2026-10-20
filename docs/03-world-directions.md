# Phase 3: World directions

Status: **decided on 2026-10-20: The Floor Is Lava.** It was Thomas's favourite on paper, in the images, and still after three more candidates were added. The visual board with all seven is at https://claude.ai/artifact/MjDTr4JR9gUfbVoqq1XfrZ, and the images are in `docs/concept/<direction>/`.

## 1. Identity brief
**Personality, in four words:** *cheeky, chunky, crafty, loud.*
- **Cheeky:** the rivalry is friendly. Targets taunt, nobody is mean.
- **Chunky:** pieces have weight, read at a glance, and feel good to knock over.
- **Crafty:** you made this fortress yourself, so it should look made with pride.
- **Loud:** the big moments are big.

**Every world must:**
- Give a reason for the core verbs: build, launch, topple.
- Have **two equal rival sides**. There's no villain, because both sides are players.
- Explain the two ranges (each launcher faces one fortress), what counts as "the ground" that puts a target out, repairs, and the three modes as events of one competition.
- Have **targets with faces**: they are their owner's stand-in on the other player's screen, so they laugh, cheer and taunt.
- Have 3–4 materials that differ in **shape and how they break**, not just colour, plus a sound for each.
- Have two team colours that colour-blind players can tell apart. Blue against orange or red is the safest pair.

**Must not:**
- Use birds or pigs, or any trace of Angry Birds' round angry faces.
- Look like Wingnut Circus: vintage poster, barn red and brass, paper grain, ragtime.
- Look like generic medieval knights and castles.
- Show blood or anything grim.

**Production constraint:** all in-game art is **drawn in code** (canvas or SVG), as in Wingnut Circus. So the style has to work as flat shapes, simple shading, outlines and a few gradients, and characters must be buildable from basic shapes. Code is good at fracture, because blocks breaking into polygon shards is cheap, and bad at painterly texture. The concept prompts are written in a flat vector style so we don't fall for concept art we couldn't produce.

## 2. Landscape audit
Where comparable games sit visually:

| | Glossy, digital | Handmade, crafted |
|---|---|---|
| **Soft, round** | Angry Birds, Bad Piggies, Cut the Rope, Fall Guys, Worms. **Crowded: mobile physics games live here** | LittleBigPlanet, Tearaway, Kirby's Epic Yarn, Crayon Physics Deluxe |
| **Graphic, flat** | Alto's Adventure, Monument Valley, Untitled Goose Game | Apotheon (Greek vase painting), Wingnut Circus (vintage poster) |

**Reading:** mobile physics games cluster in the top-left square. The open space for us is on the crafted side and the graphic side, while staying clear of Wingnut Circus's vintage-poster corner.

Where the four directions land:
- **Garden Feud:** soft and glossy, so the crowded square. It needs a sharp edge to stand out.
- **The Floor Is Lava:** soft and crafted, plus a crayon layer.
- **Low Tide:** between soft-glossy and graphic-flat, with a sun-bleached look.
- **The Topple Games:** graphic and crafted. Its nearest neighbour is Apotheon.

## 3. Four directions

### A. Garden Feud
**Premise:** two neighbouring allotment gardens, separated by a hedge, have feuded for decades. Every summer the allotment club's festival settles it: each side stacks a tower of flower pots, pallet planks, bricks and greenhouse glass, crowns it with garden gnomes, and lobs vegetables over the hedge until the gnomes hit the lawn. It's the German *Schrebergarten* turned into a sport: petty pride, measured hedge heights, gnome kitsch.

| Game element | In this world |
|---|---|
| Fortress | A garden tower |
| Materials | Terracotta pots (shatter into shards), pallet planks (splinter), bricks (heavy, strong), greenhouse glass (fragile, spectacular) |
| Launcher | A slingshot from a forked apple-tree branch and a garden bungee cord |
| Projectiles | Potato (basic heavy), pea pod (splits into three), carrot (drills), chili (explodes), pumpkin (huge and heavy), corn cob (pops) |
| Targets | Ceramic garden gnomes. Team colour is the hat: **blue against orange**, not the classic red, to stay clear of Wingnut's barn red |
| Ground | The lawn. "Gnome down!" |
| Repair | Gardening: a trowel, string, tape |
| Modes as events | Festival competitions: three rounds = the club cup, three volleys = the siege of the hedge, race = the harvest rush |
| Flavour mechanic | **Hedge height** as the arena variant in the shared draw. A taller hedge forces higher lobs |

- **Tone:** suburban satire, a warm summer afternoon, people who take their gnomes far too seriously.
- **References:** *Wallace & Gromit: The Curse of the Were-Rabbit* (vegetable-show rivalry), *Gnomeo & Juliet* (feuding gardens), *Untitled Goose Game* (garden mischief), the German allotment club.
- **Palette sketch:** lawn `#6CBF4F`, hedge `#2F7D3B`, terracotta `#D9734E`, sky `#9FD8F7`, cream `#FFF4DC`, team blue `#2F6FDE`, team orange `#F28C28`, ink `#2B2B35`.
- **Why it could win:** the funniest premise, with a very specific joke you and your friends will get immediately. Gnomes are the perfect targets: figurines with faces, iconic silhouettes, no living thing harmed. Pots and glass break beautifully.
- **Risks:** it sits in the crowded visual square. Green, wood and red drift towards Wingnut Circus. *Gnomeo & Juliet* already used the feuding-gardens joke, though not in a game. The vegetables only have character if they get faces.

### B. The Floor Is Lava
**Premise:** two siblings share a bedroom split down the middle by a strip of masking tape. When it rains, war breaks out: each builds a fort from the toy box, puts their favourite plush toys on top, and fires marbles across the tape. The floor is lava, so anything that touches it is gone.

| Game element | In this world |
|---|---|
| Fortress | A toy-box fort |
| Materials | Playing cards (house of cards, flutters down), wooden toy blocks (clack), dominoes (topple in chains), hardcover books (heavy, strong) |
| Launcher | A rubber band stretched between two pencils on a book |
| Projectiles | Glass marble (fast and heavy), bouncy ball (bounces), spinning top (drills), yo-yo (comes back), jacks (split), water balloon (splash) |
| Targets | Plush toys with button eyes. Team colour is a bandana: **blue against yellow**, since orange would vanish in the lava |
| Ground | The floor, drawn as crayon lava. Toys that touch it melt away in crayon |
| Repair | Raiding the toy box |
| Modes as events | Rainy-day games: three rounds = best of three, three volleys = siege of the fort, race = "before Mum comes in" |
| Flavour mechanic | **Two visual layers.** The real room is drawn clean. Everything imagined (lava, flames, explosions, speed lines) is drawn on top in wobbly crayon, as if the kid were drawing over the scene. Arena variants: lights out (torchlight), the attic, the bathtub |

- **Tone:** childhood nostalgia, imagination against reality, cheeky chaos.
- **References:** *Calvin and Hobbes* (the imagination layer over reality, beloved by adults), *Bluey* (sibling games), *Micro Machines* (tabletop scale), *Crayon Physics Deluxe*, Quentin Blake's scribbly line.
- **Palette sketch:** floorboards `#C98B5A`, wall `#F4E9D8`, toy red `#E63B2E`, toy yellow `#F7C531`, toy blue `#2F6FDE`, crayon lava `#FF5A1F`, ink `#2E2A33`.
- **Why it could win:**
  - **Fits the rules:** "the floor is lava" is a game everyone already knows, and it *is* our rule that a target is out when it touches the ground.
  - **Ownable style:** the crayon layer is the most ownable idea of the four, and jittered crayon strokes are cheap to draw in code.
  - **Nostalgia:** adults remember these rainy afternoons.
- **Risks:** it can read as a children's game. It sits close to *Toy Story* in theme. The two layers make the art harder to get right.

### C. Low Tide
**Premise:** when the tide goes out, two hermit-crab clans race to build sandcastles on neighbouring sandbanks, crown them with their champions, and fling shells at each other's castle. Anything that falls into the sea is washed away, and the tide is coming back in.

| Game element | In this world |
|---|---|
| Fortress | A sandcastle |
| Materials | Dry sand (crumbles to dust), packed wet sand (holds), driftwood (planks), sea glass (shatters), pebbles (heavy) |
| Launcher | A slingshot from forked driftwood and a stretchy kelp band |
| Projectiles | Periwinkle shell (basic), sea urchin (spiky), pufferfish (puffs up and shoves blocks apart), starfish (spins), clam (splits into pearls), coconut (heavy) |
| Targets | Champion hermit crabs in decorated shells. Team colour is the shell pattern: **coral against deep blue** |
| Ground | The sea |
| Repair | Patting fresh sand onto the castle |
| Modes as events | The tide calendar: three rounds = three low tides, three volleys = one tide going out and coming back, race = "before the wave" |
| Flavour mechanic | **The tide rises** after every volley (B) or over time (C), swallowing the lower parts of each fortress. **The world itself enforces pillar 2, "build to show off, not to hide":** low fortresses drown, so they have to go up |

- **Tone:** sunny, breezy, a comic nature documentary.
- **References:** *Blue Planet* (hermit crabs fighting over shells), Ghibli's *Ponyo* (the seaside), Wes Anderson's *The Life Aquatic* (pastel sea palette), *Animal Crossing* (beach charm).
- **Palette sketch:** dry sand `#F2D6A2`, wet sand `#C9A36B`, turquoise `#2EC4B6`, deep sea `#1B4965`, coral `#FF6B5B`, shell pink `#F7C6C7`, foam `#FDFBF5`.
- **Why it could win:** the best fit between theme and mechanics. The tide is a rule the world explains by itself, and it pushes towards tall fortresses. Crumbling dry sand is a satisfying sight and sound. Crabs snapping their claws make great taunts.
- **Risks:**
  - **Crabs are trendy:** *King of Crabs* and *Another Crab's Treasure* already exist.
  - **Sand and water cost effort in code:** dust particles and a water surface need performance work.
  - **Generic beach risk:** it could look like any beach game.

### D. The Topple Games
**Premise:** every four years, two rival city-states settle their rivalry at the Topple Games. Each builds a small temple of marble columns, cedar beams and terracotta pots, places its champions on the roof (tiny heroes under enormous plumed helmets), and hurls discuses, amphorae and boulders at the other's temple. Whoever falls to the ground is out, which is a dishonour. The whole game is painted around the belly of an amphora in **black-figure vase painting**.

| Game element | In this world |
|---|---|
| Fortress | A temple |
| Materials | Marble columns and slabs (heavy, columns roll), cedar beams (medium), terracotta pots and tiles (shatter), bronze shields (strong) |
| Launcher | A giant sling stretched between two short columns |
| Projectiles | Boulder (heavy), discus (fast and flat), amphora (shatters and spills oil, so surfaces turn slippery), olive volley (splits), javelin (pierces), pot of Greek fire (explodes) |
| Targets | Champions with huge plumed helmets. Team colour is the plume: **Aegean blue against marble white** |
| Ground | The arena floor, and dishonour |
| Repair | The masons |
| Modes as events | Disciplines of the Games: three rounds = the trial of three, three volleys = the siege, race = the *stadion* (the original Olympic footrace) |
| Flavour mechanic | **The world is a vase.** The arena is painted in a band around an amphora, and Greek vases really do have an A side and a B side: one range on each. The camera pans around the vase. Spilled oil makes surfaces slippery, which is a small physics twist |

- **Tone:** mock-heroic slapstick, grand gestures and silly falls.
- **References:**
  - **Exekias**, the master of black-figure painting.
  - **Disney's *Hercules*** (1997), whose design drew on Greek vases and Gerald Scarfe's line.
  - ***Asterix***, for the tone.
  - ***Apotheon*** (2015), an action game in black-figure style: it proves the style works in games, and it's the nearest neighbour.
- **Palette sketch:** terracotta `#C8643B`, black `#1D1A17`, cream `#EFE3C8`, marble `#F4F1EA`, olive `#7A8B3A`, Aegean blue `#2F6DB5`.
- **Why it could win:**
  - **Most ownable look:** nobody has made a physics duel that looks like this, and it's furthest from every other direction and from Wingnut Circus.
  - **Ideal for code:** flat silhouettes with fine line details are exactly what code draws best.
  - **The best collapse:** marble columns falling like bowling pins.
- **Risks:**
  - **Readability:** a two-tone palette makes four materials hard to tell apart, so it needs carefully added colour.
  - **Tone:** it can feel like a museum. The comedy has to be genuinely funny, not educational.
  - **Expressions:** small silhouettes show less facial expression than gnomes, plushies or crabs.

## 3b. Three more (added at Thomas's request, 2026-10-20)
These fill gaps the first four leave open. All four of those are daytime and warm, three of them are about children or animals, and none is built purely from what code draws best.

### E. Cubicle Wars
**Premise:** two rival coworkers whose desks face each other across a low cubicle divider. When the afternoon drags, each builds a tower of paper cups, sticky-note pads, ring binders and coffee mugs, puts their bobblehead figurines on top, and fires office supplies over the divider. Whatever falls off the desk is out.

| Game element | In this world |
|---|---|
| Fortress | A desk tower |
| Materials | Paper cups (light, crumple), sticky-note pads (stack, flutter), ring binders (heavy, flat), coffee mugs (ceramic, shatter) |
| Launcher | A rubber band stretched over a ruler, clamped to the desk with a binder clip |
| Projectiles | Paper ball (basic), rubber-band ball (bounces), stapler (heavy), paperclips (split), fidget spinner (drills), coffee pod (bursts) |
| Targets | Bobblehead figurines. Team colour is the tie: **blue against orange**. Their heads wobble on every hit, so the comedy comes free with the physics |
| Ground | Off the desk, onto the carpet |
| Repair | Raiding the supply cupboard |
| Modes as events | The working week: three rounds = Monday, Wednesday, Friday; three volleys = the quarterly review; race = the five o'clock rush |
| Flavour mechanic | **The desk fan** as the arena variant: a visible, steady draught, the same for both players, shown by paper streamers. Wind is allowed under pillar 3, which says anything random must be visible and the same for both |

- **Tone:** deadpan office comedy for adults.
- **References:** *The Office*, *Office Space*, *Severance* (palette), mid-century office design.
- **Palette sketch:** office teal `#2F6B66`, mint wall `#BFD8CF`, carpet slate `#4A5A66`, paper `#F7F7F2`, sticky yellow `#FFE45C`, sticky pink `#FF8FB1`, coffee `#7A4E2D`.
- **Why it could win:** the only world about grown-up life. "Off the desk" is instantly readable, the materials are everyday objects as in Floor Is Lava, and bobbleheads are built-in slapstick.
- **Risks:** an office reminds people of work. The palette can go grey and flat. The characters are little people, which are harder to draw well than gnomes or crabs.

### F. Battle of the Bands
**Premise:** two rival garage bands at a festival. Each stacks a tower of amplifiers, speaker cabinets, road cases, drums and stage lights, puts its band members on top as rock stars, and fires vinyl records and bass drums at the other stack from a giant guitar whose strings work as a slingshot. Whoever falls into the mosh pit gets carried off by the crowd.

| Game element | In this world |
|---|---|
| Fortress | A stack of stage gear |
| Materials | Speaker cabinets (heavy, they boom), road cases (medium, metal corners), drums (round, they roll), stage-light panels (glass, shatter in sparks) |
| Launcher | A giant guitar: you pull the strings back like a slingshot |
| Projectiles | Vinyl record (fast and flat), drumsticks (split), bass drum (heavy roller), disco ball (shatters), confetti cannon (bursts), sound-wave blast (pushes) |
| Targets | Rock-star band members. Team colour is the bandana: **blue against orange** |
| Ground | The mosh pit |
| Repair | The roadies |
| Modes as events | The gig: three rounds = opening act, headliner, encore; three volleys = the set; race = battle of the bands |
| Flavour mechanic | **The collapse is music.** Every material plays its instrument when hit (cabinets thump, cymbals crash, lights fizz), snapped to a beat, so every collapse sounds like a riff. Pillar 1 becomes audible |

- **Tone:** loud rock comedy.
- **References:** *School of Rock*, *Scott Pilgrim vs. the World*, *Brütal Legend*, Tenacious D, *Guitar Hero*.
- **Palette sketch:** stage black `#14111C`, haze purple `#3B2A5C`, magenta `#FF2E88`, cyan `#22D3EE`, spotlight yellow `#FFE066`, amp grey `#3A3A40`.
- **Why it could win:**
  - **The only night world.** The personality word "loud" is literal here.
  - **A sound signature:** collapses that play music would be the game's audio identity, and nobody else has it.
- **Risks:**
  - **Character design:** rock stars are people, which are hard to caricature well.
  - **Audio work:** snapping sound to a beat is real work.
  - **Too close to Wingnut Circus?** A cheering crowd at the edge of the screen echoes its grandstand.

### G. Bauhaus Brawl
**Premise:** a Bauhaus poster comes to life. Two rival schools of shapes, **the Circles and the Squares**, each build a composition of red squares, yellow triangles, blue circles and black beams, put their googly-eyed champions on top, and fire shapes at each other. Whatever falls below the ground line is out.

| Game element | In this world |
|---|---|
| Fortress | A composition |
| Materials | Red squares (heavy, stack), yellow triangles (light, wedge), blue circles and half circles (roll, make arches), black beams (long, strong) |
| Launcher | A black bar with a stretched line |
| Projectiles | Black square (heavy), yellow triangle (spins, drills), blue circle (bounces), red arc (splits in three), black bar (sweeps like a propeller), dot cluster (bursts) |
| Targets | Googly-eyed shape champions. **Teams are told apart by body shape** (round Circles against square Squares), which works for colour-blind players by definition |
| Ground | Below the black ground line |
| Repair | The workshop |
| Modes as events | The school year: three rounds = the foundation course, three volleys = the exhibition, race = the deadline |
| Flavour mechanic | **Shape is physics.** Circles roll, triangles wedge, squares stack, so the look tells you exactly how each piece behaves. The colours follow Kandinsky's 1923 Bauhaus questionnaire, which paired yellow with the triangle, red with the square and blue with the circle |

- **Tone:** graphic, witty, cheeky geometry.
- **References:** Bauhaus posters (Herbert Bayer, Joost Schmidt), Oskar Schlemmer's *Triadic Ballet*, Kandinsky, Edwin Abbott's *Flatland* (a whole world of 2D shapes), *Thomas Was Alone*.
- **Palette sketch:** red `#E1251B`, yellow `#F6C700`, blue `#1F4E9E`, black `#111111`, ground `#EFEBE0`.
- **Why it could win:** the most code-native look possible, since it's literally made of basic shapes. The physics can be read from the shapes alone. German design heritage is a home-turf in-joke, as with the Schrebergarten.
- **Risks:**
  - **Too cold?** It may feel cold and abstract, which is exactly why Tipping the King was dropped.
  - **Googly eyes must carry all the warmth.**
  - **Less of a place:** it's a style more than a world.

## 4. Also considered
- **Bake-off:** rival patisseries build showstopper cakes with cake toppers as targets, standing on top, which is literally our height rule. A spoon catapult, wobbly jelly blocks. Dropped because sweets and candy are the most crowded mobile look there is.
- **Snow fort war:** the snowball fight is naturally a duel. Dropped as seasonal and familiar, and the snow-and-ice materials blur together.
- **Tipping the King:** two chess sets, black against white. Toppling the king is literally the gesture of resignation in chess. Dropped as too abstract for "chunky and cheeky".

## 5. First read (provisional, to be redone with the images)
| | A. Garden Feud | B. Floor Is Lava | C. Low Tide | D. Topple Games |
|---|---|---|---|---|
| Explains our rules (ground, ranges, modes) | ●●● | ●●● | ●●● | ●●● |
| The theme strengthens a rule | ● hedge | ●● lava | ●●● tide | ● oil |
| How it breaks | ●●● | ●● | ●● | ●●● |
| Character appeal | ●●● | ●●● | ●●● | ●● |
| Ownable | ●● | ●● | ● | ●●● |
| Producible in code | ●●● | ●● | ●● | ●●● |
| Distance from Wingnut Circus | ● | ●● | ●●● | ●●● |

No favourite yet, on purpose: the images will tell us things this table can't. Each one leads somewhere different:
- **Low Tide:** the best mechanical fit.
- **Topple Games:** the most ownable look.
- **Garden Feud:** the funniest premise.
- **Floor Is Lava:** the most distinctive style idea.

The pick can also be a mix, for example Garden Feud's premise drawn in the Floor Is Lava style.

## 6. How the images were made
- Generated with Codex (gpt-image) from `docs/concept/prompts.md`: 12 images, plus 2 second takes.
- Two mock screens were redone. The first takes are kept as `03-screen-v1.jpg`:
  - **Floor Is Lava:** v1 slipped in a penguin plush and a rubber-duck projectile, both birds, and used a 3/4 perspective.
  - **Low Tide:** v1 drew the castle as one sculpted mass instead of separate blocks.
- The key art came out painterly despite "flat vector" in the prompts. That's acceptable for key art. The mock screens are the honest test of whether a style can be drawn in code.

## 7. After the images: scoring and recommendation
| | A. Garden | B. Lava | C. Tide | D. Games | E. Cubicle | F. Bands | G. Bauhaus |
|---|---|---|---|---|---|---|---|
| Spectacle in the key moment | ●●● | ●●● | ●●● | ●●● | ●● | ●●● | ●● |
| Reads at phone size | ●● | ●●● | ●● | ●●● | ●●● | ●● | ●●● |
| Materials tell apart | ●●● | ●●● | ● | ●●● | ●●● | ●●● | ●●● |
| Character appeal | ●●● | ●●● | ●●● | ●● | ●● | ●●● | ●● |
| Ownable, not Angry Birds-like | ● | ●●● | ●● | ●●● | ●● | ●●● | ●●● |
| Drawable in code | ●●● | ●●● | ● | ●●● | ●●● | ●● | ●●● |
| The world strengthens a rule | ● | ●● | ●●● | ● | ●● | ●● | ●● |
| Distance from Wingnut Circus | ● | ●● | ●●● | ●● | ●●● | ●● | ●●● |
| **Total (of 24)** | **17** | **22** | **18** | **20** | **20** | **20** | **21** |

With seven worlds the key art no longer scored the same everywhere, so spectacle was added as a criterion.

What the images taught us:
- **Garden Feud:** the best cast on the board. But round vegetables with angry eyebrows next to a slingshot and a tower read as an Angry Birds spin-off, and the game screen is generic.
- **Floor Is Lava:**
  - **The crayon layer is the most ownable idea,** and cheap to draw in code.
  - **The materials explain themselves,** because everyone knows books are heavy and cards are flimsy.
  - **The crayon notes beside the projectiles** could become the in-game way to explain abilities.
  - **Risk:** it reads as a children's game.
- **Low Tide:** the most spectacular key art, and the best rule (the rising tide). But dry and wet sand barely tell apart, a sandcastle naturally wants to be one mass rather than blocks, and water and sand are the hardest to draw in code.
- **Topple Games:** the most recognisable look and the cleanest, most code-friendly screen. Its characters have less warmth, because small black profiles show little face, and a full evening of terracotta may tire the eye.

**Recommendation:** The Floor Is Lava, plus Low Tide's best idea: **the lava rises** after every volley. That keeps the pressure to build tall without the cost of drawing water and sand. Runner-up: The Topple Games.

Notes on the three added worlds:
- **Cubicle Wars:** a very clean screen and the only grown-up world, but a generic corporate-cartoon look, and its targets are interchangeable.
- **Battle of the Bands:** the loudest key art (a guitar used as a slingshot), but its background is busy, and rock stars are the hardest characters to draw in code.
- **Bauhaus Brawl:** the only concept art that already looks shippable, but its square champions blur into its square blocks, and it has the least sense of place.

## 8. Decision
**The Floor Is Lava.** Whether the lava rises during a match is not decided yet: it's proposed as a mechanic in Phase 4 and gets tested in Phase 6. The deeper image work on the chosen world (characters, materials, UI) moves into Phase 5, once Phase 4 has fixed what needs drawing.
