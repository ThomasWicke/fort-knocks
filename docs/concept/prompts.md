# Concept art prompts (Phase 3)

Four directions with three images each. The directions are described in `docs/03-world-directions.md`.

## How they're run
**Normally Claude runs them itself through the Codex CLI**, which signs in with Thomas's ChatGPT account and uses its gpt-image model:
- Each image is a standalone `codex exec` run, made from an empty scratch folder with `--ignore-user-config --ephemeral --sandbox read-only`.
- The style block goes in front of every prompt, because separate runs don't share a chat.
- Codex saves images to `~/.codex/generated_images/`, and Claude copies them here.
- A run takes about 80 s.

**Manual fallback in the ChatGPT app**, if Codex isn't available:
1. **Use one new ChatGPT chat per direction**, so the styles don't bleed into each other.
2. **First message:** the style block and prompt 1 together, pasted as one message.
3. **Prompts 2 and 3:** send each as its own follow-up message in the same chat. They start with "Same style and world", so ChatGPT keeps the look.
4. **Save** each image as `docs/concept/<folder>/01-key.jpg`, `02-cast.jpg` and `03-screen.jpg`. The folder name is given in each heading.
5. **Regenerate only if an image is clearly broken:** wrong format, text in the image, or the wrong world. An imperfect image still tells us something.

What each image is for:
- **01-key:** the key-art moment, a fortress mid-collapse. Does the world have spectacle?
- **02-cast:** targets and projectiles. Do the characters have appeal?
- **03-screen:** a mock in-game screen. Does it read at phone size, and could we draw it in code?

---

## A. Garden Feud → `docs/concept/garden-feud/`

**Message 1 (style block and prompt 1):**
```
Style for every image in this chat: bright, sunny 2D vector game art for a mobile physics game, seen from the side. Clean flat shapes with soft cel shading, one warm sun from the upper left, crisp short shadows, thick dark outlines (#2B2B35) on characters and objects, none on the background. Palette: lawn green #6CBF4F, hedge green #2F7D3B, terracotta #D9734E, sky blue #9FD8F7, cream #FFF4DC, team blue #2F6FDE, team orange #F28C28. Modern and saturated like a high-end mobile game, not vintage, no paper texture. World: two rival neighbouring allotment gardens separated by a tall trimmed hedge. Each neighbour has stacked a tower of terracotta flower pots, wooden pallet planks, bricks and greenhouse glass panes, with glazed ceramic garden gnomes standing on top. They fire vegetables at each other's tower with slingshots. Comic, petty suburban rivalry on a warm summer afternoon. No text, letters or logos anywhere.

Image 1, key art, landscape 3:2: a tall garden tower made of stacked terracotta pots, pallet planks, bricks and greenhouse glass is collapsing mid-air after a flying pumpkin smashed into it. Glass panes burst into sparkling shards, pot shards and wood splinters fly, two orange-hatted gnomes tumble off the top with shocked faces, a third clings to a tilting plank. In the left foreground a slingshot made from a forked apple-tree branch and a garden bungee cord, with a blue-hatted gnome behind it pumping its fist. The hedge and a garden shed in the background. Dynamic, funny, strong readable silhouettes.
```

**Message 2:**
```
Same style and world. Image 2, character sheet, landscape 3:2, on a plain cream background, two rows. Top row: five glazed ceramic garden gnomes, chunky proportions, big noses and beards, pointy hats in team colours (three blue, two orange), each with a clear personality and expression: smug, furious, terrified, cheering, taunting with tongue out. Bottom row: the vegetable projectiles as game items, each with a tiny simple face: a heavy potato, a pea pod bursting into three peas, a carrot spinning like a drill, a hot chili pepper about to explode, a giant pumpkin, a corn cob popping. Same lighting and outline style throughout.
```

**Message 3:**
```
Same style and world. Image 3, a mock in-game screenshot of the mobile game, landscape 3:2, side view, flat and clean enough to be drawn in code. On the left the slingshot on a small grassy mound with a dotted aiming arc; on the right a medium tower on the lawn built from clearly distinguishable materials: terracotta pots, wooden planks, grey bricks and light-blue glass panes, with three orange-hatted gnomes standing on open ledges at different heights. Simple sky and hedge as background layers. A minimal game HUD: round icon buttons in the top corners, three small gnome-head icons showing targets remaining, a row of vegetable ammo icons bottom left. Very readable at phone size. No text.
```

---

## B. The Floor Is Lava → `docs/concept/floor-is-lava/`

**Message 1 (style block and prompt 1):**
```
Style for every image in this chat: 2D game art for a mobile physics game, seen from the side, in two layers. The real layer: a child's bedroom floor and toys drawn as clean flat vector shapes with soft shading, warm wooden floorboards (#C98B5A), a pale wall (#F4E9D8), toys in bright primary colours (red #E63B2E, yellow #F7C531, blue #2F6FDE), thin dark outlines (#2E2A33). The imagination layer: everything the kids imagine is drawn on top in wobbly crayon and marker strokes, as if a child scribbled over the scene: the floor is bubbling orange-red crayon lava (#FF5A1F) with crayon flames, plus crayon speed lines and crayon explosion scribbles. World: two siblings share a bedroom split down the middle by a strip of masking tape. Each has built a fort from wooden toy blocks, playing cards, dominoes and hardcover books, with their favourite plush toys standing on top, and they fire marbles, bouncy balls and toys at each other's fort. The floor is lava: anything that touches it is gone. Cheeky, nostalgic, chaotic. No humans visible. Toy blocks carry simple painted shapes instead of letters. No text, letters or logos anywhere.

Image 1, key art, landscape 3:2: a tall fort of wooden toy blocks, a house of playing cards and a stack of hardcover books collapsing after a big glass marble smashed into it. Cards flutter through the air, blocks tumble, a plush bunny and a plush dinosaur wearing yellow bandanas fall towards the crayon lava with panicked faces while crayon flames lick up at them. In the left foreground a slingshot made from a rubber band stretched between two pencils stuck in a book, with a plush bear in a blue bandana behind it cheering. Crayon impact scribbles around the hit. Dynamic, funny, strong readable silhouettes.
```

**Message 2:**
```
Same style and world. Image 2, character sheet, landscape 3:2, on a plain off-white background, two rows. Top row: five plush toys that are the siblings' champions, with button eyes and stitched mouths, each with a clear expression: smug, furious, terrified, cheering, taunting: a bunny, a dinosaur, a bear, an octopus and a fabric robot. Three wear blue bandanas, two wear yellow bandanas (team colours). Bottom row: the projectiles as game items: a heavy glass marble, a bouncy rubber ball, a spinning top, a yo-yo, a handful of jacks, a water balloon. Each item has a small crayon doodle beside it showing what it does (motion lines, a bounce arc, a splash). Same lighting and outline style throughout.
```

**Message 3:**
```
Same style and world. Image 3, a mock in-game screenshot of the mobile game, landscape 3:2, side view, flat and clean enough to be drawn in code. On the left the rubber-band slingshot on a book with a dotted aiming arc; on the right a medium fort on a low rug built from clearly distinguishable materials: playing cards, wooden toy blocks, dominoes and hardcover books, with three plush toys in yellow bandanas standing on open ledges at different heights. The floor around the rug is crayon lava. The masking-tape line and a bedroom wall as background. A minimal game HUD: round icon buttons in the top corners, three small plush-head icons showing targets remaining, a row of ammo icons bottom left. Very readable at phone size. No text.
```

---

## C. Low Tide → `docs/concept/low-tide/`

**Message 1 (style block and prompt 1):**
```
Style for every image in this chat: sun-bleached 2D vector game art for a mobile physics game, seen from the side. Flat shapes with soft shading, gradients only in the sea and sky, little sparkle highlights on wet surfaces, dark teal outlines (#1B4965) on characters and objects. Palette: dry sand #F2D6A2, wet sand #C9A36B, turquoise sea #2EC4B6, deep sea #1B4965, coral #FF6B5B, shell pink #F7C6C7, foam white #FDFBF5. Breezy, warm and playful, like a high-end mobile game. World: at low tide, two rival hermit-crab clans build sandcastles on neighbouring sandbanks out of dry sand, packed wet sand, driftwood, pebbles and sea glass, with their champion crabs in decorated shells standing on the towers. They fling shells, sea urchins and pufferfish at each other's castle with slingshots made of driftwood and kelp. Anything that falls into the sea is washed away, and the tide is coming back in. No text, letters or logos anywhere.

Image 1, key art, landscape 3:2: a tall sandcastle of dry-sand towers, packed wet-sand walls, driftwood planks and sea-glass windows collapsing after a pufferfish hit it and puffed up inside. Dry sand bursts into dust clouds, sea glass shatters into colourful shards, two hermit crabs in coral-patterned shells tumble off the top towards the foamy waves with shocked faces. In the left foreground on a rock, a slingshot made of forked driftwood and a stretchy kelp band, with a crab in a deep-blue-patterned shell behind it snapping its claws in triumph. The tide washes in along the bottom. Dynamic, funny, strong readable silhouettes.
```

**Message 2:**
```
Same style and world. Image 2, character sheet, landscape 3:2, on a plain pale-sand background, two rows. Top row: five hermit-crab champions, each in a different decorated shell (three with deep-blue patterns, two with coral patterns, as team colours), each with a clear expression: smug, furious, terrified, cheering, taunting with raised claws. Bottom row: the projectiles as game items: a periwinkle shell, a spiky sea urchin, a pufferfish shown both deflated and puffed up, a spinning starfish, a clam splitting open into pearls, a heavy coconut. Same lighting and outline style throughout.
```

**Message 3:**
```
Same style and world. Image 3, a mock in-game screenshot of the mobile game, landscape 3:2, side view, flat and clean enough to be drawn in code. On the left the driftwood-and-kelp slingshot on a rock with a dotted aiming arc; on the right a medium sandcastle on a sandbank built from clearly distinguishable materials: dry sand blocks, darker packed wet sand, driftwood planks, grey pebbles and sea-glass panes, with three crabs in coral-patterned shells standing on open ledges at different heights. The sea surrounds the sandbank, with a clear waterline creeping up the base. Simple sky as background. A minimal game HUD: round icon buttons in the top corners, three small crab-shell icons showing targets remaining, a row of ammo icons bottom left, and a small tide gauge. Very readable at phone size. No text.
```

---

## D. The Topple Games → `docs/concept/topple-games/`

**Message 1 (style block and prompt 1):**
```
Style for every image in this chat: 2D game art for a mobile physics game, seen from the side, in the style of ancient Greek black-figure vase painting brought to life: flat black silhouettes (#1D1A17) with fine incised cream lines (#EFE3C8) for details, on a warm terracotta ground (#C8643B), framed by meander and palmette border bands at top and bottom, as if the whole scene were painted around the belly of an amphora. Extra colours used sparingly as flat fills: marble white #F4F1EA, olive green #7A8B3A, Aegean blue #2F6DB5. Crisp, graphic and elegant, but the action is slapstick comedy. World: at the Topple Games, two rival city-states each build a small temple of marble columns, marble slabs, cedar beams and terracotta pots, with their champions — tiny heroes under enormous plumed helmets — standing on the roof, and they hurl boulders, discuses and amphorae at each other's temple with a giant sling. Whoever falls to the ground is out. No text, letters or logos anywhere.

Image 1, key art, landscape 3:2: a small Greek temple of marble columns, cedar beams and stacked terracotta pots collapsing after a flying boulder smashed into it. Columns topple like bowling pins, pots shatter into shards, two tiny heroes with huge white plumes fall from the roof in comically outraged poses, one helmet flying off. In the left foreground a giant sling stretched between two short columns, pulled back by a hero with a blue plume, while a row of tiny spectators cheers on a stepped stand behind. Meander borders top and bottom. Dynamic, funny, strong readable silhouettes.
```

**Message 2:**
```
Same style and world. Image 2, character sheet, landscape 3:2, on a plain terracotta background with meander borders, two rows. Top row: five champions with enormous plumed helmets (three with Aegean-blue plumes, two with marble-white plumes, as team colours) in expressive comic poses: smug, furious, terrified, cheering, taunting. Bottom row: the projectiles as game items: a heavy boulder, a spinning discus, an amphora sloshing oil, a volley of olives, a javelin, a clay pot of Greek fire. Same style throughout.
```

**Message 3:**
```
Same style and world. Image 3, a mock in-game screenshot of the mobile game, landscape 3:2, side view, flat and clean enough to be drawn in code. On the left the giant sling between two short columns with a dotted aiming arc; on the right a medium temple built from clearly distinguishable materials: white marble columns and slabs, brown cedar beams, terracotta pots and tiles, and round bronze shields, with three white-plumed champions standing on open ledges at different heights. A simple background with the stepped spectator stand. A minimal game HUD: round icon buttons in the top corners, three small helmet icons showing targets remaining, a row of ammo icons bottom left. Meander border bands at top and bottom. Very readable at phone size. No text.
```

---

## E. Cubicle Wars → `docs/concept/cubicle-wars/`

**Message 1 (style block and prompt 1):**
```
Style for every image in this chat: crisp 2D vector game art for a mobile physics game, seen from the side. Clean flat shapes with soft shading, cool fluorescent office light from above, thin dark outlines (#1F2A30) on characters and objects. Palette: office teal #2F6B66, mint wall #BFD8CF, carpet slate #4A5A66, paper white #F7F7F2, sticky-note yellow #FFE45C, sticky-note pink #FF8FB1, coffee brown #7A4E2D, team blue #2F6FDE, team orange #F28C28. Deadpan office comedy with a mid-century modern look, like a stylish high-end mobile game. World: two rival coworkers whose desks face each other across a low cubicle divider. Each has built a tower on their desk out of paper cups, sticky-note pads, ring binders and coffee mugs, with little bobblehead figurines standing on top, and they fire crumpled paper balls, rubber-band balls and staplers at each other's tower with a rubber band stretched over a ruler. Anything that falls off the desk onto the carpet is out. No people other than the bobblehead figurines. No text, letters or logos anywhere; screens and paper are blank.

Image 1, key art, landscape 3:2: a tall desk tower of paper cups, sticky-note pads, ring binders and coffee mugs collapsing after a heavy stapler smashed into it. Mugs shatter, paper cups and sticky notes fly, coffee splashes, two bobblehead figurines in orange ties tumble off the desk edge towards the carpet with wobbling heads and shocked faces. In the left foreground a launcher made of a rubber band stretched over a ruler clamped to the desk with a binder clip, with a bobblehead in a blue tie behind it cheering, its head bobbling. A cubicle divider, a desk lamp and a potted cactus in the background. Dynamic, funny, strong readable silhouettes.
```

**Message 2:**
```
Same style and world. Image 2, character sheet, landscape 3:2, on a plain mint background, two rows. Top row: five bobblehead figurines with oversized heads on springs, office clothes and ties in team colours (three blue, two orange), each with a clear expression: smug, furious, terrified, cheering, taunting with tongue out. Bottom row: the projectiles as game items: a crumpled paper ball, a bouncy rubber-band ball, a heavy stapler, a handful of paperclips flying apart, a spinning fidget spinner, a coffee pod bursting. Same lighting and outline style throughout.
```

**Message 3:**
```
Same style and world. Image 3, a mock in-game screenshot of the mobile game, landscape 3:2, in strict side view like a classic 2D physics game (no perspective), flat and clean enough to be drawn in code. On the left the ruler-and-rubber-band launcher clamped to the edge of a desk, with a dotted aiming arc; on the right a medium tower on the opposite desk built from clearly separate pieces: paper cups, sticky-note pads, ring binders and coffee mugs, with three bobbleheads in orange ties standing on open ledges at different heights. The carpet as a band along the bottom, the cubicle divider and an office window as background. A minimal game HUD: round icon buttons in the top corners, three small bobblehead-head icons showing targets remaining, and three ammo icons bottom left: a paper ball, a rubber-band ball, a stapler. Very readable at phone size. No text.
```

---

## F. Battle of the Bands → `docs/concept/battle-of-the-bands/`

**Message 1 (style block and prompt 1):**
```
Style for every image in this chat: bold 2D vector game art for a mobile physics game, seen from the side, at night on a festival stage. Flat shapes with hard-edged neon light, glowing spotlights and coloured haze, thick black outlines on characters and objects. Palette: stage black #14111C, haze purple #3B2A5C, hot magenta #FF2E88, electric cyan #22D3EE, spotlight yellow #FFE066, amp grey #3A3A40, team blue #2F6FDE, team orange #FF7A1A. Loud, cheeky rock-and-roll comedy, like a stylish high-end mobile game. World: two rival garage bands at a festival. Each has stacked a tower of amplifiers, speaker cabinets, road cases, drums and stage lights, with their band members standing on top as rock stars, and they launch vinyl records, drumsticks and bass drums at each other's stack using a giant guitar whose strings work as a slingshot. Anyone who falls into the mosh pit below is carried away by the crowd and is out. No text, letters or logos anywhere.

Image 1, key art, landscape 3:2: a tall stack of amplifiers, speaker cabinets, road cases and drums collapsing after a rolling bass drum smashed into it. Stage lights shatter in a shower of sparks, cymbals fly, rings of sound waves burst from every impact, two rock stars in orange bandanas tumble off the top towards the mosh pit with screaming faces, one still clutching a guitar. In the left foreground a giant guitar standing upright with its strings pulled back like a slingshot, and a rock star in a blue bandana behind it in a power stance. The crowd's raised hands silhouetted along the bottom, spotlights sweeping through haze. Dynamic, funny, strong readable silhouettes.
```

**Message 2:**
```
Same style and world. Image 2, character sheet, landscape 3:2, on a plain dark purple background, two rows. Top row: five rock-star band members (a drummer, a bassist, a singer, a guitarist, a keytar player), chunky caricature proportions, bandanas in team colours (three blue, two orange), each with a clear expression: smug, furious, terrified, cheering, taunting with tongue out. Bottom row: the projectiles as game items: a vinyl record spinning like a disc, a pair of drumsticks splitting apart, a heavy rolling bass drum, a disco ball, a confetti cannon bursting, a glowing sound-wave blast. Same lighting and outline style throughout.
```

**Message 3:**
```
Same style and world. Image 3, a mock in-game screenshot of the mobile game, landscape 3:2, in strict side view like a classic 2D physics game (no perspective), flat and clean enough to be drawn in code. On the left the giant guitar slingshot on a small riser with a dotted aiming arc; on the right a medium stack on the stage built from clearly separate pieces: black speaker cabinets, silver road cases, drums, and glass stage-light panels, with three rock stars in orange bandanas standing on open ledges at different heights. The mosh pit as a band of crowd silhouettes along the bottom, a lighting truss with spotlights as background. A minimal game HUD: round icon buttons in the top corners, three small rock-star-head icons showing targets remaining, and three ammo icons bottom left: a vinyl record, drumsticks, a bass drum. Very readable at phone size. No text.
```

---

## G. Bauhaus Brawl → `docs/concept/bauhaus-brawl/`

**Message 1 (style block and prompt 1):**
```
Style for every image in this chat: 2D game art for a mobile physics game, seen from the side, in the style of a Bauhaus poster brought to life: pure geometric shapes (circles, squares, triangles and thick bars) in flat primary colours, red #E1251B, yellow #F6C700, blue #1F4E9E and black #111111, on a warm off-white ground #EFEBE0. Crisp edges, no gradients, no outlines except where black bars are part of the design. Strict, elegant composition, but the characters are cheeky: every character is a simple geometric figure with big googly eyes and tiny stick limbs. World: two rival schools of shapes, the Circles (round-bodied champions) and the Squares (square-bodied champions). Each builds a tower out of geometric blocks: heavy red squares, light yellow triangles, rolling blue circles and half circles, and black beams, with their googly-eyed champions standing on top, and they fire shapes at each other's tower from a slingshot made of a black bar and a stretched line. Anything that falls below the black ground line is out. No text, letters or logos anywhere.

Image 1, key art, landscape 3:2: a tall tower of red squares, yellow triangles, blue circles and black beams collapsing after a heavy black square projectile smashed into it. Triangles spin away, circles roll off, a beam snaps in two, two square-bodied googly-eyed champions tumble off the top with their eyes rolling in panic. In the left foreground the slingshot made of a black bar and a stretched line, with a round-bodied googly-eyed champion behind it cheering. Big flat background shapes like a Bauhaus poster: a huge half-circle sun and diagonal bars. Dynamic, funny, strong readable silhouettes.
```

**Message 2:**
```
Same style and world. Image 2, character sheet, landscape 3:2, on a plain off-white background, two rows. Top row: five champions built from simple geometric shapes with big googly eyes and tiny stick limbs (three round-bodied Circles, two square-bodied Squares), each showing a clear expression through eyes, bar-shaped eyebrows and pose: smug, furious, terrified, cheering, taunting. Bottom row: the projectiles as game items: a heavy black square, a spinning yellow triangle, a bouncing blue circle, a red arc splitting into three, a black bar spinning like a propeller, a cluster of small dots bursting. Same style throughout.
```

**Message 3:**
```
Same style and world. Image 3, a mock in-game screenshot of the mobile game, landscape 3:2, in strict side view like a classic 2D physics game (no perspective), flat and clean enough to be drawn in code. On the left the black-bar slingshot with a dotted aiming arc made of small circles; on the right a medium tower standing on a thick black ground line, built from clearly separate pieces: red squares, yellow triangles, blue circles and half circles, and black beams, with three square-bodied googly-eyed champions standing on open ledges at different heights. Background: off-white with a few large, faint geometric shapes. A minimal game HUD: round icon buttons in the top corners, three small champion icons showing targets remaining, and three ammo icons bottom left: a black square, a yellow triangle, a blue circle. Very readable at phone size. No text.
```
