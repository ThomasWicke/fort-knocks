# Phase 1: Brief and pillars

Status: approved by Thomas on 2026-10-20, including the pillars and the scope fence.

## Pitch and fantasy
**Pitch:** Angry Birds where your friend built the level, and you built theirs.

**Fantasy:** be the architect your friend can't topple, and the wrecking ball they can't stop.

The hook is that **each player is the other's level designer.** The emotional peak isn't your own best shot. It's watching the replay of *your* fortress coming down, with the person who did it sitting next to you.

## Players and setting
| | Decision | What it means for the design |
|---|---|---|
| Who | Thomas and friends, 2 players per match | No strangers, so there's no matchmaking, ranking, accounts or anti-cheat. Trust is assumed. |
| Device | Phones first, landscape. Laptops work too, as with Wingnut Circus | **Building:** must work with thumbs: big pieces, snapping, no pixel-precise dragging.<br>**Camera:** a whole fortress must read in a landscape phone view.<br>**Performance:** physics must hold 60 fps on a mid-range phone, which caps the number of blocks.<br>**Laptop:** a mouse drag works like a finger. |
| Setting, main | Same room, two phones | **Social layer:** the players' own voices.<br>**Shared moments:** the game supplies big moments that land on both phones at once (countdown, reveal, the last collapse), so the room can shout together.<br>**Peeking:** not a concern, friends don't cheat. Anything hidden is hidden for suspense (the reveal), not for security.<br>**Sound:** two phones play sound at once, and either may be muted, so feedback must work without sound. |
| Setting, secondary | Remote, possibly on a call | **Presence:** the game has to show the other player is there: their live activity, a few quick reactions (not chat), and the replay as the place to react.<br>**On a call** it plays like the same room. |
| Session | Several matches in a row in one evening | **Matches:** short, roughly 5–8 min (Phase 2 settles it).<br>**Rematch:** one tap.<br>**Score:** a running head-to-head tally for the evening. |

## What the friend's reaction tells us
The feedback was that Wingnut Circus was "well rounded" and still fresh after 15 minutes because each run felt different. Without reading too much into it, two principles follow, and they hold for any good game anyway:

- **Small and complete beats big and rough.** Every step must be finished and polished before more content goes in: link → lobby → match → result → rematch. So version 1 has few projectile types, but every one of them comes with full effects and feedback.
- **Freshness is required, and fair freshness is the hard part.** Wingnut Circus gets its variety from roguelite randomness, but in a duel, randomness that favours one side feels like being robbed. The answer comes from duplicate bridge, where every table plays the same deals so luck cancels out and only skill differs. Here, any random draw (blocks, ammo, arena) is **the same for both players**. The bigger source of freshness is the opponent: a human adapts, and that alone keeps match 4 different from match 1.

## Experience goals (MDA, worked backwards)
MDA (Hunicke, LeBlanc, Zubek) says to choose the experience first and derive the mechanics from it, never the other way round. The target, using LeBlanc's eight kinds of fun:

| Kind of fun | Weight | Where it comes from |
|---|---|---|
| Sensation | ●●● | The collapse: debris, slow motion, sound, the pull-back |
| Challenge | ●●● | The shot: reading the fortress, aiming, timing the ability |
| Fellowship (here, rivalry) | ●●● | Two people, one moment; the head-to-head tally |
| Expression | ●● | The fortress as your signature: cunning, showy, stubborn |
| Discovery | ● | Finding weak points and combos, learning what the opponent tends to do |
| Fantasy | ● | The world (Phase 3) |
| Narrative, Submission | none | Not this game |

Lazzaro's four keys to fun name the emotions to design for:
- **Hard fun:** *fiero*, the fist pump after a hard shot.
- **Easy fun:** curiosity, poking the physics toy.
- **People fun:** *schadenfreude* when their tower falls, amusement when yours falls badly, and pride in a fortress that survived.

Serious fun (altered states) isn't a target.

## Pillars
These break ties in every later decision. If an idea fights a pillar, the pillar wins or the pillar gets changed openly. It never gets ignored quietly.

### 1. The fall is the payoff
The collapse is the reward: for the shooter, and painfully for the builder watching. It gets the most care:
- chunky pieces, materials that break differently, and sound for each material
- slow motion on the decisive moment, and a camera that follows the fall
- the replay of your own fortress coming down
- the big moments landing on both phones at the same time

*Tie-breaker:* pick the option that makes the better collapse.

### 2. Build to show off, not to hide
Every game where you build against a human ends up with the same boring winning strategy: a squat bunker with the targets buried inside. It's also the dullest collapse to watch, so it fails pillar 1 too. The rules must make ambitious, visible fortresses the winning way to build. Defence decides *how much* survives, never *whether* the fortress can be reached.

*Tie-breaker:* a rule that makes hiding stronger is wrong.

### 3. Aim is skill, the fall is chaos
- **What you control is exact and readable:** the pull-back, the arc, the ability timing. The same shot always flies the same way, and you hit what you aimed at.
- **What happens after may be wild,** because wild collapses make stories.
- **Scoring rewards intent:** chaos decides how loud the cheer is, not who wins.

*Tie-breaker:* randomness is allowed in how things fall, never in whether a good shot counts. Anything random is visible and the same for both players.

### 4. One more match
Matches are short, the rematch is one tap, and the evening's head-to-head score is always visible. Every round should play differently: from the opponent first, then from draws both players share.

*Tie-breaker:* cut anything that makes a match longer without making it fresher.

## What this game is not (version 1)
- **Not more than two players:** no 2v2, no free-for-all, no spectators.
- **Not public:** no strangers, matchmaking, accounts, rankings, monetisation or ads. You join by link.
- **Not a progression game:** no unlocks or grinding between matches. The only memory is the head-to-head tally.
- **Not solo:** no single-player campaign. Bots exist as a balance tool, as in Wingnut Circus, and may become a practice mode later.
- **Not real-time action:** projectiles from the two players never meet in flight. Each player shoots at the other's fortress.
- **Not violent:** destruction is comic. Nothing bleeds, targets get bonked.
- **Not a level editor:** fortresses exist inside a match. Saving a favourite build is a maybe for later.

## What "it worked" looks like
1. Your friend asks for a rematch without being prompted. This is the one that counts.
2. In the same room, someone shouts during a collapse in the first match.
3. A new player understands what to do in round 1, without a wall of tutorial.
4. Match 5 of the evening still looks different from match 1: different fortresses, different plans.
5. Under 30 seconds from sending the link to playing.
6. 60 fps on both phones during the biggest collapse.

## The reference games, taken apart
For each game: what it does, why it works, what we take and what we avoid.

### Angry Birds (Rovio, 2009): the template
| Element | Why it works | For us |
|---|---|---|
| **The pull-back.** Drag the slingshot back, see the band stretch, let go. | Direct manipulation of a physical metaphor. The stretch builds tension, and release is the payoff (Swink's *Game Feel*: real-time control, simulated space, polish). | **Take** as-is. This is the one thing that must feel perfect on a phone. |
| **The last shot's trail stays on screen.** | Turns every miss into information, so you adjust a little each time. Learning *is* the fun (Koster). | **Take.** Whether you see your opponent's trail too is a Phase 2 question. |
| **Watch, then tap.** After release you only watch, except for one tap to trigger the ability. | A timing skill inside the spectacle. Keeps you leaning forward. | **Take:** one ability per projectile, triggered by one tap. |
| **The delayed collapse.** The structure keeps wobbling; the last plank falls on the last pig seconds later. | Suspense and surprise. Rewards that arrive unpredictably are the most gripping kind. | **Take.** Scoring waits until everything settles, and the camera stays on it. |
| **Birds as verbs.** Split, dash, bomb, drop, boomerang. Blue breaks glass, yellow wood, black stone. | Each projectile is a different action, not a stronger number. Materials and projectiles form a puzzle. | **Take** the roster of verbs and the material affinities. In a duel they create mind games (Phase 4). |
| **Targets with faces.** Pigs bruise, wear helmets, and laugh when you fail. | Emotional stakes and comic villainy. The failure gets a punchline. | **Take, changed:** targets belong to a *player*, so they cheer for their owner and taunt the attacker. |
| **The level has a key.** A TNT box, a loose boulder: a hidden weak point. | Discovery: reading the structure is the real puzzle. | **Answered in Phase 2:** no planted weak point. It comes from budget, physics and material-vs-projectile matchups. |
| **Score and 3 stars.** Points for destruction, bonus for unused birds. | Clear mastery goals, rewards efficiency. | **Take:** destruction plus an efficiency bonus. |
| **Instant retry.** | Failing costs nothing. | **Can't take:** in a duel there's no retry, so failure has to be *funny* rather than painful. |
| **Presentation.** Round silhouettes, saturated colour, characters' voices for every event. | Readable at phone size, charming, every event is audible. | **Take** the principle, not the look: Phase 3. |

### Crush the Castle (Armor Games, 2009): the ancestor
A trebuchet, a medieval castle, and royals to knock off. It's essentially the same mechanic as Angry Birds, released earlier. Angry Birds won on characters, charm and touch input, not on mechanics.

**Lesson:** the identity work (Phases 3 and 5) carries as much weight as the mechanics. **Avoid:** realistic medieval, which is exactly the generic look we excluded.

### Worms (Team17, 1995): artillery among friends
Turn-based artillery played on one screen, with absurd weapons like the sheep and the Holy Hand Grenade, and a visible wind arrow. Failing is hilarious: you blow yourself up.

**Take:** weapons with personality, and failure as comedy. **Avoid:** long turns and waiting (simultaneous rounds fix this), and random wind or crates deciding a game (pillar 3).

### Clash of Clans (Supercell, 2012): building against humans
You design a base, others attack it, and you watch the replay of the attack. Scoring is percentage plus a key target (stars at 50%, at the Town Hall, at 100%). Strategies for base design emerged that are all about funnelling attackers and placing traps.

**Take:**
- the defence replay as an emotional peak
- percentage destruction plus a key target as a scoring model
- clean, chunky, readable art at phone size

**Avoid:** long build times and the progression grind.

### Super Mario Maker (Nintendo, 2015): the adversarial designer
Players build levels for other players. You must beat your own level before you can upload it (the "clear check"), because otherwise nobody can guarantee it's solvable. Even so, troll and kaizo levels thrive.

**Lesson:** a designer who wants you to fail will make it nasty unless the rules stop them. Our version of the clear check is pillar 2's rule that every fortress can fall: a stability test, exposure rules, a budget.

### Poly Bridge (2016) and Besiege (2015): you build, physics judges
The best moment is watching the test, and failure is funny. In Poly Bridge, the budget is what pushes players to be creative.

**Take:** budget as the main build constraint, materials with obvious properties, and the "will it hold?" moment.

### Jenga: the same-room reference
Not a video game, but it's the closest thing to our same-room moment. Tension rises as the structure gets more precarious, the collapse is a shared climax, and everyone laughs, including the loser.

**Take:** precarious tall structures make the best drama (pillar 2 serves pillar 1).

### Wingnut Circus: what the friend already knows
**Carry over:**
- the polish bar
- art drawn in code
- procedural audio
- the "how to play" drawer
- bots as a balance tool
- PWA install on phones
- the builder's feel: grid building already works with thumbs, so snapping should be the default in Phase 4

**Make different:** the world, palette, type and tone. It must not read as Flying Circus 2.

## Fullerton's formal elements: what's settled, what's open
| Element | Status |
|---|---|
| Players | 2, each both builder and attacker every round |
| Objectives | Topple more of theirs than they topple of yours (exact scoring: Phase 2) |
| Procedures | Build → aim → release → tap ability; then watch the replay |
| Rules | Open: build rules, information order, persistence between rounds (Phase 2), numbers (Phase 4) |
| Resources | Build budget, shots, time. The mix is open (Phases 2 and 4) |
| Conflict | The opponent's fortress, built by a human who wants you to fail |
| Boundaries | An arena with two fortresses. Size and camera are open (Phases 2 and 5) |
| Outcome | Match winner plus the evening's tally |

## Handed to Phase 2
- During the build phase, what can you see of the opponent's fortress? Hidden, silhouette or live?
- Does a fortress carry over between rounds (repair what's left), or does each round start fresh?
- How do the rules force "show off, not hide"? Height, exposed targets, required weak points, scoring for what stands tall?
- What is drawn per round, the same for both players: block set, ammo, arena?
- How long is everything? Build phase, siege, reveal, match.
